import "dotenv/config";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import { parse } from "csv-parse";
import { inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  aeronaveOperadores,
  aeronaveProprietarios,
  aeronaves,
  operadores,
  proprietarios,
} from "../src/db/schema";

const CSV_URL =
  "https://www.gov.br/anac/pt-br/acesso-a-informacao/dados-abertos/areas-de-atuacao/aeronaves-1/registro-aeronautico-brasileiro/aeronaves-registradas-no-registro-aeronautico-brasileiro-csv";
const CSV_PATH = process.env.RAB_CSV_PATH ?? "data/aeronaves_rab.csv";
const BATCH = 500;

function parseJsonField(value: string): Record<string, string>[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toBool(value: string | undefined): boolean {
  return value?.toUpperCase() === "S";
}

function toInt(value: string | undefined): number | null {
  if (value == null || value === "" || value === "-") return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function toPmd(value: string | undefined): string | null {
  if (value == null || value === "" || value === "-") return null;
  let v = value.trim();
  if (v.includes(",")) {
    v = v.replace(/\./g, "").replace(",", ".");
  } else if (v.includes(".")) {
    const partes = v.split(".");
    const ultimo = partes[partes.length - 1];
    if (ultimo.length === 3) v = v.replace(/\./g, "");
  }
  v = v.replace(/^0+(?=\d)/, "");
  if (v.endsWith(".")) v = v.slice(0, -1);
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
}

function toDate(value: string | undefined): Date | null {
  if (
    value == null ||
    value === "" ||
    value === "-" ||
    value === "ABORDO" ||
    value === "RESRA" ||
    value === "RESRAB"
  )
    return null;
  let m: RegExpMatchArray | null;
  m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const ano = Number(m[3]) >= 30 ? 1900 + Number(m[3]) : 2000 + Number(m[3]);
    const d = new Date(ano, Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toSituacao(value: string | undefined): string | null {
  if (value == null || value === "" || value === "-") return null;
  return value.toUpperCase().trim();
}

type LinhaCsv = Record<string, string>;

const COLUNAS = [
  "MARCAS",
  "PROPRIETARIOS",
  "OPERADORES",
  "NR_CERT_MATRICULA",
  "NR_SERIE",
  "CD_TIPO",
  "DS_MODELO",
  "NM_FABRICANTE",
  "CD_CLS",
  "NR_PMD",
  "CD_TIPO_ICAO",
  "NR_TRIPULACAO_MIN",
  "NR_PASSAGEIROS_MAX",
  "NR_ASSENTOS",
  "NR_ANO_FABRICACAO",
  "DT_VALIDADE_CVA",
  "DT_VALIDADE_CA",
  "DT_CANC",
  "DS_MOTIVO_CANC",
  "CD_INTERDICAO",
  "DS_GRAVAME",
  "DT_MATRICULA",
  "TP_MOTOR",
  "QT_MOTOR",
  "TP_POUSO",
  "TP_CA",
  "CD_PROPOSITO_CAVE",
  "CF_OPERACIONAL",
  "DS_CATEGORIA_HOMOLOGACAO",
  "TP_OPERACAO",
] as const;

async function downloadCsv() {
  const res = await fetch(CSV_URL);
  if (!res.ok || !res.body) throw new Error(`Falha ao baixar CSV: ${res.status}`);
  await mkdir("data", { recursive: true });
  await pipeline(
    Readable.fromWeb(res.body as ReadableStream),
    createWriteStream(CSV_PATH),
  );
  console.log(`CSV baixado em ${CSV_PATH}`);
}

async function lerLinhas(): Promise<LinhaCsv[]> {
  const linhas: LinhaCsv[] = [];
  const parser = createReadStream(CSV_PATH, { encoding: "utf-8" }).pipe(
    parse({
      delimiter: ";",
      bom: true,
      skip_empty_lines: true,
      from_line: 3,
      columns: [...COLUNAS],
    }),
  );
  for await (const linha of parser) {
    linhas.push(linha as LinhaCsv);
  }
  console.log(`Lidas ${linhas.length} linhas do CSV`);
  return linhas;
}

async function upsertProprietarios(linhas: LinhaCsv[]) {
  const mapa = new Map<string, typeof proprietarios.$inferInsert>();
  for (const l of linhas) {
    for (const p of parseJsonField(l.PROPRIETARIOS)) {
      const documento = (p.DOCUMENTO ?? "").trim();
      if (!documento) continue;
      mapa.set(documento, {
        nome: (p.NOME ?? "").trim(),
        documento,
        uf: (p.UF ?? "").trim() || null,
      });
    }
  }
  const todos = [...mapa.values()];
  for (let i = 0; i < todos.length; i += BATCH) {
    const lote = todos.slice(i, i + BATCH);
    await db
      .insert(proprietarios)
      .values(lote)
      .onConflictDoUpdate({
        target: proprietarios.documento,
        set: { nome: sql`excluded.nome`, uf: sql`excluded.uf`, updatedAt: new Date() },
      });
  }
  const ids = await db
    .select({ id: proprietarios.id, documento: proprietarios.documento })
    .from(proprietarios)
    .where(inArray(proprietarios.documento, todos.map((p) => p.documento)));
  const porDocumento = new Map(ids.map((r) => [r.documento, r.id]));
  console.log(`Proprietários: ${ids.length} registros`);
  return porDocumento;
}

async function upsertOperadores(linhas: LinhaCsv[]) {
  const mapa = new Map<string, typeof operadores.$inferInsert>();
  for (const l of linhas) {
    for (const o of parseJsonField(l.OPERADORES)) {
      const documento = (o.DOCUMENTO ?? "").trim();
      if (!documento) continue;
      mapa.set(documento, {
        nome: (o.NOME ?? "").trim(),
        documento,
        uf: (o.UF ?? "").trim() || null,
        operacao135: toBool(o.OPERACAO135),
        transregular135: toBool(o.TRANSPREGULAR135),
        autorizacaopmac135: toBool(o.AUTORIZACAOPMAC135),
        operacao121: toBool(o.OPERACAO121),
        transregular121: toBool(o.TRANSPREGULAR121),
        autorizacaopmac121: toBool(o.AUTORIZACAOPMAC121),
        sae: toBool(o.SAE),
        authistrut: toBool(o.AUTHISTRUT),
      });
    }
  }
  const todos = [...mapa.values()];
  for (let i = 0; i < todos.length; i += BATCH) {
    const lote = todos.slice(i, i + BATCH);
    await db
      .insert(operadores)
      .values(lote)
      .onConflictDoUpdate({
        target: operadores.documento,
        set: {
          nome: sql`excluded.nome`,
          uf: sql`excluded.uf`,
          operacao135: sql`excluded.operacao135`,
          transregular135: sql`excluded.transregular135`,
          autorizacaopmac135: sql`excluded.autorizacaopmac135`,
          operacao121: sql`excluded.operacao121`,
          transregular121: sql`excluded.transregular121`,
          autorizacaopmac121: sql`excluded.autorizacaopmac121`,
          sae: sql`excluded.sae`,
          authistrut: sql`excluded.authistrut`,
          updatedAt: new Date(),
        },
      });
  }
  const ids = await db
    .select({ id: operadores.id, documento: operadores.documento })
    .from(operadores)
    .where(inArray(operadores.documento, todos.map((o) => o.documento)));
  const porDocumento = new Map(ids.map((r) => [r.documento, r.id]));
  console.log(`Operadores: ${ids.length} registros`);
  return porDocumento;
}

async function upsertAeronaves(linhas: LinhaCsv[]) {
  const registros = linhas.map((l) => ({
    marcas: (l.MARCAS ?? "").trim(),
    nrCertMatricula: toInt(l.NR_CERT_MATRICULA),
    nrSerie: l.NR_SERIE?.trim() || null,
    cdTipo: l.CD_TIPO?.trim() || null,
    dsModelo: l.DS_MODELO?.trim() || null,
    nmFabricante: l.NM_FABRICANTE?.trim() || null,
    cdCls: l.CD_CLS?.trim() || null,
    nrPmd: toPmd(l.NR_PMD),
    cdTipoIcao: l.CD_TIPO_ICAO?.trim() || null,
    nrTripulacaoMin: toInt(l.NR_TRIPULACAO_MIN),
    nrPassageirosMax: toInt(l.NR_PASSAGEIROS_MAX),
    nrAssentos: toInt(l.NR_ASSENTOS),
    nrAnoFabricacao: toInt(l.NR_ANO_FABRICACAO),
    dtValidadeCva: l.DT_VALIDADE_CVA?.trim() || null,
    dtValidadeCa: toDate(l.DT_VALIDADE_CA),
    dtCanc: toDate(l.DT_CANC),
    dsMotivoCanc: l.DS_MOTIVO_CANC?.trim() || null,
    cdInterdicao: toSituacao(l.CD_INTERDICAO),
    dsGravame: l.DS_GRAVAME?.trim() || null,
    dtMatricula: toDate(l.DT_MATRICULA),
    tpMotor: l.TP_MOTOR?.trim() || null,
    qtMotor: toInt(l.QT_MOTOR),
    tpPouso: l.TP_POUSO?.trim() || null,
    tpCa: l.TP_CA?.trim() || null,
    cdPropositoCave: l.CD_PROPOSITO_CAVE?.trim() || null,
    cfOperacional: l.CF_OPERACIONAL?.trim() || null,
    dsCategoriaHomologacao: l.DS_CATEGORIA_HOMOLOGACAO?.trim() || null,
    tpOperacao: l.TP_OPERACAO?.trim() || null,
  }));
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH);
    await db
      .insert(aeronaves)
      .values(lote)
      .onConflictDoUpdate({
        target: aeronaves.marcas,
        set: {
          nrCertMatricula: sql`excluded.nr_cert_matricula`,
          nrSerie: sql`excluded.nr_serie`,
          cdTipo: sql`excluded.cd_tipo`,
          dsModelo: sql`excluded.ds_modelo`,
          nmFabricante: sql`excluded.nm_fabricante`,
          cdCls: sql`excluded.cd_cls`,
          nrPmd: sql`excluded.nr_pmd`,
          cdTipoIcao: sql`excluded.cd_tipo_icao`,
          nrTripulacaoMin: sql`excluded.nr_tripulacao_min`,
          nrPassageirosMax: sql`excluded.nr_passageiros_max`,
          nrAssentos: sql`excluded.nr_assentos`,
          nrAnoFabricacao: sql`excluded.nr_ano_fabricacao`,
          dtValidadeCva: sql`excluded.dt_validade_cva`,
          dtValidadeCa: sql`excluded.dt_validade_ca`,
          dtCanc: sql`excluded.dt_canc`,
          dsMotivoCanc: sql`excluded.ds_motivo_canc`,
          cdInterdicao: sql`excluded.cd_interdicao`,
          dsGravame: sql`excluded.ds_gravame`,
          dtMatricula: sql`excluded.dt_matricula`,
          tpMotor: sql`excluded.tp_motor`,
          qtMotor: sql`excluded.qt_motor`,
          tpPouso: sql`excluded.tp_pouso`,
          tpCa: sql`excluded.tp_ca`,
          cdPropositoCave: sql`excluded.cd_proposito_cave`,
          cfOperacional: sql`excluded.cf_operacional`,
          dsCategoriaHomologacao: sql`excluded.ds_categoria_homologacao`,
          tpOperacao: sql`excluded.tp_operacao`,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Aeronaves: ${registros.length} registros`);
}

async function upsertVinculos(
  linhas: LinhaCsv[],
  propIds: Map<string, number>,
  opIds: Map<string, number>,
) {
  const vinculosProp: (typeof aeronaveProprietarios.$inferInsert)[] = [];
  const vinculosOp: (typeof aeronaveOperadores.$inferInsert)[] = [];
  for (const l of linhas) {
    const marcas = (l.MARCAS ?? "").trim();
    for (const p of parseJsonField(l.PROPRIETARIOS)) {
      const id = propIds.get((p.DOCUMENTO ?? "").trim());
      if (id) {
        vinculosProp.push({
          aeronaveMarcas: marcas,
          proprietarioId: id,
          percentual: toPmd(p.PERCENTUAL),
        });
      }
    }
    for (const o of parseJsonField(l.OPERADORES)) {
      const id = opIds.get((o.DOCUMENTO ?? "").trim());
      if (id) {
        vinculosOp.push({ aeronaveMarcas: marcas, operadorId: id });
      }
    }
  }
  await db.delete(aeronaveProprietarios);
  await db.delete(aeronaveOperadores);
  for (let i = 0; i < vinculosProp.length; i += BATCH) {
    await db
      .insert(aeronaveProprietarios)
      .values(vinculosProp.slice(i, i + BATCH))
      .onConflictDoNothing();
  }
  for (let i = 0; i < vinculosOp.length; i += BATCH) {
    await db
      .insert(aeronaveOperadores)
      .values(vinculosOp.slice(i, i + BATCH))
      .onConflictDoNothing();
  }
  console.log(
    `Vínculos: ${vinculosProp.length} proprietários, ${vinculosOp.length} operadores`,
  );
}

async function main() {
  const modo = process.argv[2];
  if (modo === "baixar" || !existsSync(CSV_PATH)) {
    await downloadCsv();
  }
  const linhas = await lerLinhas();
  if (linhas.length === 0) throw new Error("CSV vazio");
  const propIds = await upsertProprietarios(linhas);
  const opIds = await upsertOperadores(linhas);
  await upsertAeronaves(linhas);
  await upsertVinculos(linhas, propIds, opIds);
  console.log("Importação concluída com sucesso!");
}

main().catch((err) => {
  console.error("Erro na importação:", err);
  process.exit(1);
});