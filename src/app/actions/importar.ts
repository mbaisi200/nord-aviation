"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  aeronaveOperadores,
  aeronaveProprietarios,
  aeronaves,
  operadores,
  proprietarios,
} from "@/db/schema";
import { exigirSessao } from "@/lib/auth";
import {
  parseJsonField,
  toBool,
  toDate,
  toInt,
  toPmd,
  toSituacao,
} from "@/lib/rab";

const BATCH = 500;
const MAX_LOTE = 3000;

function validarPeriodo(periodo: string) {
  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    throw new Error("Período inválido — use o formato AAAA-MM (ex.: 2026-09)");
  }
}

export async function iniciarImportacao(
  periodo: string,
): Promise<{ ok: boolean }> {
  await exigirSessao();
  validarPeriodo(periodo);
  await db.delete(aeronaves).where(eq(aeronaves.periodo, periodo));
  await db.delete(proprietarios).where(eq(proprietarios.periodo, periodo));
  await db.delete(operadores).where(eq(operadores.periodo, periodo));
  await db
    .delete(aeronaveProprietarios)
    .where(eq(aeronaveProprietarios.periodo, periodo));
  await db
    .delete(aeronaveOperadores)
    .where(eq(aeronaveOperadores.periodo, periodo));
  revalidatePath("/");
  revalidatePath("/aeronaves");
  revalidatePath("/comparar");
  revalidatePath("/importar");
  return { ok: true };
}

export async function importarLote(
  periodo: string,
  linhas: Record<string, string>[],
): Promise<{ ok: boolean }> {
  await exigirSessao();
  validarPeriodo(periodo);
  if (!Array.isArray(linhas) || linhas.length === 0 || linhas.length > MAX_LOTE) {
    throw new Error("Lote de linhas inválido");
  }

  const props = new Map<string, typeof proprietarios.$inferInsert>();
  const ops = new Map<string, typeof operadores.$inferInsert>();
  const registros: (typeof aeronaves.$inferInsert)[] = [];
  const vinculosProp: (typeof aeronaveProprietarios.$inferInsert)[] = [];
  const vinculosOp: (typeof aeronaveOperadores.$inferInsert)[] = [];

  for (const l of linhas) {
    const marcas = (l.MARCAS ?? "").trim();
    if (!marcas) continue;
    registros.push({
      marcas,
      periodo,
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
    });
    for (const p of parseJsonField(l.PROPRIETARIOS)) {
      const documento = (p.DOCUMENTO ?? "").trim();
      if (!documento) continue;
      props.set(documento, {
        documento,
        periodo,
        nome: (p.NOME ?? "").trim(),
        uf: (p.UF ?? "").trim() || null,
      });
      vinculosProp.push({
        aeronaveMarcas: marcas,
        periodo,
        proprietarioDocumento: documento,
        percentual: toPmd(p.PERCENTUAL),
      });
    }
    for (const o of parseJsonField(l.OPERADORES)) {
      const documento = (o.DOCUMENTO ?? "").trim();
      if (!documento) continue;
      ops.set(documento, {
        documento,
        periodo,
        nome: (o.NOME ?? "").trim(),
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
      vinculosOp.push({
        aeronaveMarcas: marcas,
        periodo,
        operadorDocumento: documento,
      });
    }
  }

  const propsArr = [...props.values()];
  for (let i = 0; i < propsArr.length; i += BATCH) {
    await db
      .insert(proprietarios)
      .values(propsArr.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: [proprietarios.documento, proprietarios.periodo],
        set: { nome: sql`excluded.nome`, uf: sql`excluded.uf`, updatedAt: new Date() },
      });
  }

  const opsArr = [...ops.values()];
  for (let i = 0; i < opsArr.length; i += BATCH) {
    await db
      .insert(operadores)
      .values(opsArr.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: [operadores.documento, operadores.periodo],
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

  for (let i = 0; i < registros.length; i += BATCH) {
    await db
      .insert(aeronaves)
      .values(registros.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: [aeronaves.marcas, aeronaves.periodo],
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

  return { ok: true };
}