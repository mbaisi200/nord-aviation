"use server";

import { and, asc, desc, eq, exists, gte, ilike, lte, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { aeronaveOperadores, aeronaveProprietarios, aeronaves, operadores, proprietarios } from "@/db/schema";
import { aeronaveSchema, toDate, toInt, toNumeric } from "@/lib/aeronave";
import { exigirSessao } from "@/lib/auth";
import { PERIODO_MANUAL, periodoAtual } from "@/lib/periodo";
import { traduzirIcao } from "@/lib/icao-types";

export type ActionState = { ok: boolean; error?: string };

export type FiltrosAeronaves = {
  situacao?: string;
  fabricante?: string;
  modelo?: string;
  tpMotor?: string;
  qtMotor?: string;
  tpPouso?: string;
  tpCa?: string;
  cfOperacional?: string;
  categoria?: string;
  tpOperacao?: string;
  anoDe?: string;
  anoAte?: string;
  proprietario?: string;
  operador?: string;
};

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
  if (filtros.situacao) {
    condicoes.push(
      sql`left(coalesce(${aeronaves.cdInterdicao}, ''), 1) = ${filtros.situacao}`,
    );
  }
  if (filtros.fabricante) {
    condicoes.push(ilike(aeronaves.nmFabricante, `%${filtros.fabricante}%`));
  }
  if (filtros.modelo) {
    condicoes.push(
      or(
        ilike(aeronaves.dsModelo, `%${filtros.modelo}%`),
        ilike(aeronaves.dsTipoIcaoNome, `%${filtros.modelo}%`),
        ilike(aeronaves.cdTipoIcao, `%${filtros.modelo}%`),
      ),
    );
  }
  if (filtros.tpMotor) {
    condicoes.push(eq(aeronaves.tpMotor, filtros.tpMotor));
  }
  if (filtros.qtMotor) {
    condicoes.push(eq(aeronaves.qtMotor, Number(filtros.qtMotor)));
  }
  if (filtros.tpPouso) {
    condicoes.push(eq(aeronaves.tpPouso, filtros.tpPouso));
  }
  if (filtros.tpCa) {
    condicoes.push(eq(aeronaves.tpCa, filtros.tpCa));
  }
  if (filtros.cfOperacional) {
    condicoes.push(eq(aeronaves.cfOperacional, filtros.cfOperacional));
  }
  if (filtros.categoria) {
    condicoes.push(eq(aeronaves.dsCategoriaHomologacao, filtros.categoria));
  }
  if (filtros.tpOperacao) {
    condicoes.push(eq(aeronaves.tpOperacao, filtros.tpOperacao));
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

  const filtro = condicoes.length > 0 ? and(...condicoes) : undefined;
  const [registros, [{ total }]] = await Promise.all([
    db
      .select()
      .from(aeronaves)
      .where(filtro)
      .orderBy(desc(aeronaves.dtMatricula), asc(aeronaves.marcas))
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