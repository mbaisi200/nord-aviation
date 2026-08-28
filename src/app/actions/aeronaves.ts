"use server";

import { and, asc, desc, eq, exists, gte, ilike, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { aeronaveOperadores, aeronaveProprietarios, aeronaves, operadores, proprietarios } from "@/db/schema";
import { aeronaveSchema, situacaoLabel, toDate, toInt, toNumeric } from "@/lib/aeronave";
import { exigirSessao } from "@/lib/auth";
import { PERIODO_MANUAL, periodoAtual } from "@/lib/periodo";
import { traduzirIcao } from "@/lib/icao-types";

export type ActionState = { ok: boolean; error?: string };

export type FiltrosAeronaves = {
  situacao?: string[];
  fabricante?: string[];
  modelo?: string[];
  tpMotor?: string[];
  qtMotor?: string[];
  tpPouso?: string[];
  tpCa?: string[];
  cfOperacional?: string[];
  categoria?: string[];
  tpOperacao?: string[];
  anoDe?: string;
  anoAte?: string;
  proprietario?: string;
  operador?: string;
  ufProprietario?: string[];
  ufOperador?: string[];
  ordenacao?: string;
};

export async function listarFabricantes(): Promise<string[]> {
  const pAtual = await periodoAtual();
  const rows = await db
    .selectDistinct({ v: aeronaves.nmFabricante })
    .from(aeronaves)
    .where(
      and(
        or(
          eq(aeronaves.periodo, pAtual ?? ""),
          eq(aeronaves.periodo, PERIODO_MANUAL),
        ),
        isNotNull(aeronaves.nmFabricante),
      ),
    )
    .orderBy(aeronaves.nmFabricante);
  return rows.map((r) => r.v!).filter(Boolean);
}

export async function listarModelos(): Promise<string[]> {
  const pAtual = await periodoAtual();
  const rows = await db
    .selectDistinct({ v: aeronaves.dsModelo })
    .from(aeronaves)
    .where(
      and(
        or(
          eq(aeronaves.periodo, pAtual ?? ""),
          eq(aeronaves.periodo, PERIODO_MANUAL),
        ),
        isNotNull(aeronaves.dsModelo),
      ),
    )
    .orderBy(aeronaves.dsModelo);
  return rows.map((r) => r.v!).filter(Boolean);
}

export async function listarUfsProprietarios(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: proprietarios.uf })
    .from(proprietarios)
    .where(and(isNotNull(proprietarios.uf), sql`${proprietarios.uf} != ''`))
    .orderBy(proprietarios.uf);
  return rows.map((r) => r.v!).filter(Boolean);
}

export async function listarUfsOperadores(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: operadores.uf })
    .from(operadores)
    .where(and(isNotNull(operadores.uf), sql`${operadores.uf} != ''`))
    .orderBy(operadores.uf);
  return rows.map((r) => r.v!).filter(Boolean);
}

function toInsert(data: z.infer<typeof aeronaveSchema>) {
  const cdIcao = data.cdTipoIcao?.trim() || null;
  const nomeIcao = cdIcao ? traduzirIcao(cdIcao) : "";
  return {
    marcas: data.marcas,
    periodo: PERIODO_MANUAL,
    nrCertMatricula: toInt(data.nrCertMatricula),
    nrSerie: data.nrSerie || null,
    cdTipo: data.cdTipo || null,
    dsModelo: data.dsModelo || null,
    nmFabricante: data.nmFabricante || null,
    cdCls: data.cdCls || null,
    nrPmd: toNumeric(data.nrPmd),
    cdTipoIcao: cdIcao,
    dsTipoIcaoNome: nomeIcao && nomeIcao !== cdIcao ? nomeIcao : nomeIcao || null,
    nrTripulacaoMin: toInt(data.nrTripulacaoMin),
    nrPassageirosMax: toInt(data.nrPassageirosMax),
    nrAssentos: toInt(data.nrAssentos),
    nrAnoFabricacao: toInt(data.nrAnoFabricacao),
    dtValidadeCva: data.dtValidadeCva || null,
    dtValidadeCa: toDate(data.dtValidadeCa),
    dtCanc: toDate(data.dtCanc),
    dsMotivoCanc: data.dsMotivoCanc || null,
    cdInterdicao: data.cdInterdicao || null,
    dsGravame: data.dsGravame || null,
    dtMatricula: toDate(data.dtMatricula),
    tpMotor: data.tpMotor || null,
    qtMotor: toInt(data.qtMotor),
    tpPouso: data.tpPouso || null,
    tpCa: data.tpCa || null,
    cdPropositoCave: data.cdPropositoCave || null,
    cfOperacional: data.cfOperacional || null,
    dsCategoriaHomologacao: data.dsCategoriaHomologacao || null,
    tpOperacao: data.tpOperacao || null,
  };
}

export async function criarAeronave(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirSessao();
  const parsed = aeronaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }
  const existe = await db
    .select({ marcas: aeronaves.marcas })
    .from(aeronaves)
    .where(eq(aeronaves.marcas, parsed.data.marcas))
    .limit(1);
  if (existe.length > 0) {
    return {
      ok: false,
      error: `A aeronave ${parsed.data.marcas} já está cadastrada`,
    };
  }
  await db
    .insert(aeronaves)
    .values(toInsert(parsed.data))
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
        dsTipoIcaoNome: sql`excluded.ds_tipo_icao_nome`,
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
  revalidatePath("/aeronaves");
  redirect(`/aeronaves/${parsed.data.marcas}`);
}

export async function atualizarAeronave(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirSessao();
  const parsed = aeronaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }
  await db
    .insert(aeronaves)
    .values(toInsert(parsed.data))
    .onConflictDoUpdate({
      target: [aeronaves.marcas, aeronaves.periodo],
      set: {
        ...toInsert(parsed.data),
        updatedAt: new Date(),
      },
    });
  revalidatePath("/aeronaves");
  redirect(`/aeronaves/${parsed.data.marcas}`);
}

export async function excluirAeronave(formData: FormData): Promise<void> {
  await exigirSessao();
  const marcas = String(formData.get("marcas") ?? "");
  await db
    .delete(aeronaves)
    .where(and(eq(aeronaves.marcas, marcas), eq(aeronaves.periodo, PERIODO_MANUAL)));
  revalidatePath("/aeronaves");
  redirect("/aeronaves");
}

export async function buscarAeronaves(
  termo: string,
  pagina: number,
  filtros: FiltrosAeronaves = {},
  porPagina = 20,
) {
  const offset = (pagina - 1) * porPagina;
  const condicoes = [];
  const pAtual = await periodoAtual();
  condicoes.push(
    or(
      eq(aeronaves.periodo, pAtual ?? ""),
      eq(aeronaves.periodo, PERIODO_MANUAL),
    ),
  );

  if (termo.trim()) {
    condicoes.push(
      or(
        ilike(aeronaves.marcas, `%${termo}%`),
        ilike(aeronaves.dsModelo, `%${termo}%`),
        ilike(aeronaves.dsTipoIcaoNome, `%${termo}%`),
        ilike(aeronaves.cdTipoIcao, `%${termo}%`),
        ilike(aeronaves.nmFabricante, `%${termo}%`),
        ilike(aeronaves.nrSerie, `%${termo}%`),
      ),
    );
  }
  if (filtros.situacao?.length) {
    condicoes.push(
      or(
        ...filtros.situacao.map(
          (s) => sql`left(coalesce(${aeronaves.cdInterdicao}, ''), 1) = ${s}`,
        ),
      )!,
    );
  }
  if (filtros.fabricante?.length) {
    condicoes.push(inArray(aeronaves.nmFabricante, filtros.fabricante));
  }
  if (filtros.modelo?.length) {
    condicoes.push(
      or(
        inArray(aeronaves.dsModelo, filtros.modelo),
        inArray(aeronaves.dsTipoIcaoNome, filtros.modelo),
        inArray(aeronaves.cdTipoIcao, filtros.modelo),
      )!,
    );
  }
  if (filtros.tpMotor?.length) {
    condicoes.push(inArray(aeronaves.tpMotor, filtros.tpMotor));
  }
  if (filtros.qtMotor?.length) {
    condicoes.push(inArray(aeronaves.qtMotor, filtros.qtMotor.map(Number)));
  }
  if (filtros.tpPouso?.length) {
    condicoes.push(inArray(aeronaves.tpPouso, filtros.tpPouso));
  }
  if (filtros.tpCa?.length) {
    condicoes.push(inArray(aeronaves.tpCa, filtros.tpCa));
  }
  if (filtros.cfOperacional?.length) {
    condicoes.push(inArray(aeronaves.cfOperacional, filtros.cfOperacional));
  }
  if (filtros.categoria?.length) {
    condicoes.push(inArray(aeronaves.dsCategoriaHomologacao, filtros.categoria));
  }
  if (filtros.tpOperacao?.length) {
    condicoes.push(inArray(aeronaves.tpOperacao, filtros.tpOperacao));
  }
  if (filtros.anoDe) {
    condicoes.push(gte(aeronaves.nrAnoFabricacao, Number(filtros.anoDe)));
  }
  if (filtros.anoAte) {
    condicoes.push(lte(aeronaves.nrAnoFabricacao, Number(filtros.anoAte)));
  }
  if (filtros.proprietario) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveProprietarios)
          .innerJoin(
            proprietarios,
            and(
              eq(
                aeronaveProprietarios.proprietarioDocumento,
                proprietarios.documento,
              ),
              eq(aeronaveProprietarios.periodo, proprietarios.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveProprietarios.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveProprietarios.periodo, aeronaves.periodo),
              ilike(proprietarios.nome, `%${filtros.proprietario}%`),
            ),
          ),
      ),
    );
  }
  if (filtros.ufProprietario?.length) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveProprietarios)
          .innerJoin(
            proprietarios,
            and(
              eq(
                aeronaveProprietarios.proprietarioDocumento,
                proprietarios.documento,
              ),
              eq(aeronaveProprietarios.periodo, proprietarios.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveProprietarios.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveProprietarios.periodo, aeronaves.periodo),
              inArray(proprietarios.uf, filtros.ufProprietario),
            ),
          ),
      ),
    );
  }
  if (filtros.operador) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveOperadores)
          .innerJoin(
            operadores,
            and(
              eq(aeronaveOperadores.operadorDocumento, operadores.documento),
              eq(aeronaveOperadores.periodo, operadores.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveOperadores.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveOperadores.periodo, aeronaves.periodo),
              ilike(operadores.nome, `%${filtros.operador}%`),
            ),
          ),
      ),
    );
  }
  if (filtros.ufOperador?.length) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveOperadores)
          .innerJoin(
            operadores,
            and(
              eq(aeronaveOperadores.operadorDocumento, operadores.documento),
              eq(aeronaveOperadores.periodo, operadores.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveOperadores.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveOperadores.periodo, aeronaves.periodo),
              inArray(operadores.uf, filtros.ufOperador),
            ),
          ),
      ),
    );
  }

  const filtro = condicoes.length > 0 ? and(...condicoes) : undefined;

  const ordMap: Record<string, ReturnType<typeof desc>> = {
    matricula_desc: desc(aeronaves.dtMatricula),
    matricula_asc: asc(aeronaves.dtMatricula),
    marcas_asc: asc(aeronaves.marcas),
    marcas_desc: desc(aeronaves.marcas),
    modelo_asc: asc(aeronaves.dsModelo),
    modelo_desc: desc(aeronaves.dsModelo),
    fabricante_asc: asc(aeronaves.nmFabricante),
    fabricante_desc: desc(aeronaves.nmFabricante),
    ano_desc: desc(aeronaves.nrAnoFabricacao),
    ano_asc: asc(aeronaves.nrAnoFabricacao),
  };
  const ord = ordMap[filtros.ordenacao ?? "matricula_desc"] ?? desc(aeronaves.dtMatricula);

  const [registros, [{ total }]] = await Promise.all([
    db
      .select()
      .from(aeronaves)
      .where(filtro)
      .orderBy(ord, asc(aeronaves.marcas))
      .limit(porPagina)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(aeronaves)
      .where(filtro),
  ]);
  return {
    registros,
    total,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/* ------------------------------------------------------------------ */
/*  Shared query builder for exports (no pagination)                   */
/* ------------------------------------------------------------------ */

type ExportRow = {
  marcas: string;
  modelo: string | null;
  situacao: string | null;
  proprietarioNome: string | null;
  proprietarioUf: string | null;
  operadorNome: string | null;
  operadorUf: string | null;
};

const CABECALHO = [
  "Prefixo",
  "Modelo",
  "Situação",
  "Proprietário",
  "UF Proprietário",
  "Operador",
  "UF Operador",
];

function rowToArray(r: ExportRow): string[] {
  return [
    r.marcas,
    r.modelo ?? "",
    r.situacao ? situacaoLabel(r.situacao) : "",
    r.proprietarioNome ?? "",
    r.proprietarioUf ?? "",
    r.operadorNome ?? "",
    r.operadorUf ?? "",
  ];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buscarDadosExport(termo: string, filtros: FiltrosAeronaves): Promise<ExportRow[]> {
  const pAtual = await periodoAtual();
  const condicoes = [];
  condicoes.push(
    or(
      eq(aeronaves.periodo, pAtual ?? ""),
      eq(aeronaves.periodo, PERIODO_MANUAL),
    ),
  );
  if (termo.trim()) {
    condicoes.push(
      or(
        ilike(aeronaves.marcas, `%${termo}%`),
        ilike(aeronaves.dsModelo, `%${termo}%`),
        ilike(aeronaves.dsTipoIcaoNome, `%${termo}%`),
        ilike(aeronaves.cdTipoIcao, `%${termo}%`),
        ilike(aeronaves.nmFabricante, `%${termo}%`),
        ilike(aeronaves.nrSerie, `%${termo}%`),
      ),
    );
  }
  if (filtros.situacao?.length) {
    condicoes.push(
      or(
        ...filtros.situacao.map(
          (s) => sql`left(coalesce(${aeronaves.cdInterdicao}, ''), 1) = ${s}`,
        ),
      )!,
    );
  }
  if (filtros.fabricante?.length) {
    condicoes.push(inArray(aeronaves.nmFabricante, filtros.fabricante));
  }
  if (filtros.modelo?.length) {
    condicoes.push(
      or(
        inArray(aeronaves.dsModelo, filtros.modelo),
        inArray(aeronaves.dsTipoIcaoNome, filtros.modelo),
        inArray(aeronaves.cdTipoIcao, filtros.modelo),
      )!,
    );
  }
  if (filtros.tpMotor?.length) {
    condicoes.push(inArray(aeronaves.tpMotor, filtros.tpMotor));
  }
  if (filtros.qtMotor?.length) {
    condicoes.push(inArray(aeronaves.qtMotor, filtros.qtMotor.map(Number)));
  }
  if (filtros.tpPouso?.length) {
    condicoes.push(inArray(aeronaves.tpPouso, filtros.tpPouso));
  }
  if (filtros.tpCa?.length) {
    condicoes.push(inArray(aeronaves.tpCa, filtros.tpCa));
  }
  if (filtros.cfOperacional?.length) {
    condicoes.push(inArray(aeronaves.cfOperacional, filtros.cfOperacional));
  }
  if (filtros.categoria?.length) {
    condicoes.push(inArray(aeronaves.dsCategoriaHomologacao, filtros.categoria));
  }
  if (filtros.tpOperacao?.length) {
    condicoes.push(inArray(aeronaves.tpOperacao, filtros.tpOperacao));
  }
  if (filtros.anoDe) {
    condicoes.push(gte(aeronaves.nrAnoFabricacao, Number(filtros.anoDe)));
  }
  if (filtros.anoAte) {
    condicoes.push(lte(aeronaves.nrAnoFabricacao, Number(filtros.anoAte)));
  }
  if (filtros.proprietario) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveProprietarios)
          .innerJoin(
            proprietarios,
            and(
              eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento),
              eq(aeronaveProprietarios.periodo, proprietarios.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveProprietarios.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveProprietarios.periodo, aeronaves.periodo),
              ilike(proprietarios.nome, `%${filtros.proprietario}%`),
            ),
          ),
      ),
    );
  }
  if (filtros.ufProprietario?.length) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveProprietarios)
          .innerJoin(
            proprietarios,
            and(
              eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento),
              eq(aeronaveProprietarios.periodo, proprietarios.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveProprietarios.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveProprietarios.periodo, aeronaves.periodo),
              inArray(proprietarios.uf, filtros.ufProprietario),
            ),
          ),
      ),
    );
  }
  if (filtros.operador) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveOperadores)
          .innerJoin(
            operadores,
            and(
              eq(aeronaveOperadores.operadorDocumento, operadores.documento),
              eq(aeronaveOperadores.periodo, operadores.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveOperadores.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveOperadores.periodo, aeronaves.periodo),
              ilike(operadores.nome, `%${filtros.operador}%`),
            ),
          ),
      ),
    );
  }
  if (filtros.ufOperador?.length) {
    condicoes.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(aeronaveOperadores)
          .innerJoin(
            operadores,
            and(
              eq(aeronaveOperadores.operadorDocumento, operadores.documento),
              eq(aeronaveOperadores.periodo, operadores.periodo),
            ),
          )
          .where(
            and(
              eq(aeronaveOperadores.aeronaveMarcas, aeronaves.marcas),
              eq(aeronaveOperadores.periodo, aeronaves.periodo),
              inArray(operadores.uf, filtros.ufOperador),
            ),
          ),
      ),
    );
  }
  const filtro = condicoes.length > 0 ? and(...condicoes) : undefined;

  // Subquery: primeiros proprietários por aeronave
  const propSub = db
    .select({
      aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas,
      periodo: aeronaveProprietarios.periodo,
      proprietarioNome: sql<string>`min(${proprietarios.nome})`.as("proprietario_nome"),
      proprietarioUf: sql<string>`min(${proprietarios.uf})`.as("proprietario_uf"),
    })
    .from(aeronaveProprietarios)
    .innerJoin(
      proprietarios,
      and(
        eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento),
        eq(aeronaveProprietarios.periodo, proprietarios.periodo),
      ),
    )
    .groupBy(aeronaveProprietarios.aeronaveMarcas, aeronaveProprietarios.periodo)
    .as("prop_sub");

  // Subquery: primeiros operadores por aeronave
  const opSub = db
    .select({
      aeronaveMarcas: aeronaveOperadores.aeronaveMarcas,
      periodo: aeronaveOperadores.periodo,
      operadorNome: sql<string>`min(${operadores.nome})`.as("operador_nome"),
      operadorUf: sql<string>`min(${operadores.uf})`.as("operador_uf"),
    })
    .from(aeronaveOperadores)
    .innerJoin(
      operadores,
      and(
        eq(aeronaveOperadores.operadorDocumento, operadores.documento),
        eq(aeronaveOperadores.periodo, operadores.periodo),
      ),
    )
    .groupBy(aeronaveOperadores.aeronaveMarcas, aeronaveOperadores.periodo)
    .as("op_sub");

  return db
    .select({
      marcas: aeronaves.marcas,
      modelo: aeronaves.dsModelo,
      situacao: aeronaves.cdInterdicao,
      proprietarioNome: propSub.proprietarioNome,
      proprietarioUf: propSub.proprietarioUf,
      operadorNome: opSub.operadorNome,
      operadorUf: opSub.operadorUf,
    })
    .from(aeronaves)
    .leftJoin(propSub, and(
      eq(propSub.aeronaveMarcas, aeronaves.marcas),
      eq(propSub.periodo, aeronaves.periodo),
    ))
    .leftJoin(opSub, and(
      eq(opSub.aeronaveMarcas, aeronaves.marcas),
      eq(opSub.periodo, aeronaves.periodo),
    ))
    .where(filtro)
    .orderBy(desc(aeronaves.dtMatricula), asc(aeronaves.marcas));
}

/* ------------------------------------------------------------------ */
/*  XLS export (SpreadsheetML 2003)                                    */
/* ------------------------------------------------------------------ */

export async function exportarXls(
  termo: string,
  filtros: FiltrosAeronaves,
): Promise<{ xml: string; total: number }> {
  const rows = await buscarDadosExport(termo, filtros);

  const xmlRows = rows
    .map((r) => {
      const cells = rowToArray(r)
        .map((v, i) => {
          const col = String.fromCharCode(65 + i); // A-N
          return `<Cell><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="hdr">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#D9E2F3" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Aeronaves">
    <Table>
      <Row>
        ${CABECALHO.map((h) => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("\n        ")}
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

  return { xml, total: rows.length };
}

/* ------------------------------------------------------------------ */
/*  PDF export (styled HTML → browser print)                           */
/* ------------------------------------------------------------------ */

export async function exportarPdf(
  termo: string,
  filtros: FiltrosAeronaves,
): Promise<{ html: string; total: number }> {
  const rows = await buscarDadosExport(termo, filtros);

  const tableRows = rows
    .map((r) => {
      const cells = rowToArray(r)
        .map((v) => `<td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${escapeXml(v)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const headerCells = CABECALHO
    .map((h) => `<th style="padding:6px 8px;background:#1e3a5f;color:#fff;text-align:left;font-size:11px;white-space:nowrap;">${escapeXml(h)}</th>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Aeronaves - RAB</title>
<style>
  @page { size: landscape; margin: 15mm; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #64748b; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { position: sticky; top: 0; }
  tr:nth-child(even) { background: #f8fafc; }
  td { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Consultar Aeronaves — RAB</h1>
  <div class="sub">${rows.length} registro${rows.length === 1 ? "" : "s"} · Exportado em ${new Date().toLocaleDateString("pt-BR")}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  return { html, total: rows.length };
}
