import { NextRequest, NextResponse } from "next/server";
import { compararPeriodos, type ResultadoComparacao } from "@/app/actions/comparar";
import { exigirSessao } from "@/lib/auth";

export const runtime = "nodejs";

function escaparXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function gerarXml(r: ResultadoComparacao): string {
  const linhas: string[] = [];
  linhas.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  linhas.push(
    `<comparacao-rab base="${escaparXml(r.base)}" alvo="${escaparXml(r.alvo)}">`,
  );
  linhas.push(`  <gerado-em>${new Date().toISOString()}</gerado-em>`);
  linhas.push(
    `  <resumo novos="${r.resumo.novos}" removidos="${r.resumo.removidos}" alterados="${r.resumo.alterados}" sem-alteracao="${r.resumo.semAlteracao}"/>`,
  );
  linhas.push(`  <registros-novos>`);
  for (const m of r.novos) linhas.push(`    <marcas>${escaparXml(m)}</marcas>`);
  linhas.push(`  </registros-novos>`);
  linhas.push(`  <registros-removidos>`);
  for (const m of r.removidos) linhas.push(`    <marcas>${escaparXml(m)}</marcas>`);
  linhas.push(`  </registros-removidos>`);
  linhas.push(`  <registros-alterados>`);
  for (const d of r.alterados) {
    linhas.push(`    <aeronave marcas="${escaparXml(d.marcas)}">`);
    for (const c of d.campos) {
      linhas.push(
        `      <alteracao campo="${escaparXml(c.campo)}" antes="${escaparXml(c.antes)}" depois="${escaparXml(c.depois)}"/>`,
      );
    }
    if (
      d.proprietarios.adicionados.length ||
      d.proprietarios.removidos.length ||
      d.proprietarios.alterados.length
    ) {
      linhas.push(`      <proprietarios>`);
      for (const e of d.proprietarios.adicionados)
        linhas.push(`        <adicionado>${escaparXml(e)}</adicionado>`);
      for (const e of d.proprietarios.removidos)
        linhas.push(`        <removido>${escaparXml(e)}</removido>`);
      for (const e of d.proprietarios.alterados)
        linhas.push(
          `        <alterado antes="${escaparXml(e.antes)}" depois="${escaparXml(e.depois)}">${escaparXml(e.entidade)}</alterado>`,
        );
      linhas.push(`      </proprietarios>`);
    }
    if (
      d.operadores.adicionados.length ||
      d.operadores.removidos.length ||
      d.operadores.alterados.length
    ) {
      linhas.push(`      <operadores>`);
      for (const e of d.operadores.adicionados)
        linhas.push(`        <adicionado>${escaparXml(e)}</adicionado>`);
      for (const e of d.operadores.removidos)
        linhas.push(`        <removido>${escaparXml(e)}</removido>`);
      for (const e of d.operadores.alterados)
        linhas.push(
          `        <alterado antes="${escaparXml(e.antes)}" depois="${escaparXml(e.depois)}">${escaparXml(e.entidade)}</alterado>`,
        );
      linhas.push(`      </operadores>`);
    }
    linhas.push(`    </aeronave>`);
  }
  linhas.push(`  </registros-alterados>`);
  linhas.push(`</comparacao-rab>`);
  return linhas.join("\n");
}

export async function GET(req: NextRequest) {
  await exigirSessao();
  const base = req.nextUrl.searchParams.get("base") ?? "";
  const alvo = req.nextUrl.searchParams.get("alvo") ?? "";
  const formato = req.nextUrl.searchParams.get("formato") ?? "xml";
  if (formato !== "xml") {
    return NextResponse.json({ error: "Formato não suportado" }, { status: 400 });
  }
  const resultado = await compararPeriodos(base, alvo, 1, 1000000);
  const xml = gerarXml(resultado);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="comparacao-rab-${base}-${alvo}.xml"`,
    },
  });
}