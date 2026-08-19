"use server";

import { and, asc, desc, eq, exists, gte, ilike, lte, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { aeronaveOperadores, aeronaveProprietarios, aeronaves, operadores, proprietarios } from "@/db/schema";
import { aeronaveSchema, toDate, toInt, toNumeric } from "@/lib/aeronave";
import { exigirSessao } from "@/lib/auth";

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
  return {
    marcas: data.marcas,
    nrCertMatricula: toInt(data.nrCertMatricula),
    nrSerie: data.nrSerie || null,
    cdTipo: data.cdTipo || null,
    dsModelo: data.dsModelo || null,
    nmFabricante: data.nmFabricante || null,
    cdCls: data.cdCls || null,
    nrPmd: toNumeric(data.nrPmd),
    cdTipoIcao: data.cdTipoIcao || null,
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
  await db.insert(aeronaves).values(toInsert(parsed.data));
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
    .update(aeronaves)
    .set({ ...toInsert(parsed.data), updatedAt: new Date() })
    .where(eq(aeronaves.marcas, parsed.data.marcas));
  revalidatePath("/aeronaves");
  redirect(`/aeronaves/${parsed.data.marcas}`);
}

export async function excluirAeronave(formData: FormData): Promise<void> {
  await exigirSessao();
  const marcas = String(formData.get("marcas") ?? "");
  await db.delete(aeronaves).where(eq(aeronaves.marcas, marcas));
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

  if (termo.trim()) {
    condicoes.push(
      or(
        ilike(aeronaves.marcas, `%${termo}%`),
        ilike(aeronaves.dsModelo, `%${termo}%`),
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
    condicoes.push(ilike(aeronaves.dsModelo, `%${filtros.modelo}%`));
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
            eq(aeronaveProprietarios.proprietarioId, proprietarios.id),
          )
          .where(
            and(
              eq(aeronaveProprietarios.aeronaveMarcas, aeronaves.marcas),
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
            eq(aeronaveOperadores.operadorId, operadores.id),
          )
          .where(
            and(
              eq(aeronaveOperadores.aeronaveMarcas, aeronaves.marcas),
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