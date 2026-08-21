import { NextRequest, NextResponse } from "next/server";
import { compararPeriodos, type ResultadoComparacao } from "@/app/actions/comparar";
import { exigirSessao } from "@/lib/auth";
import { situacaoLabel } from "@/lib/aeronave";
import { traduzirIcao } from "@/lib/icao-types";

export const runtime = "nodejs";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodificarValor(campo: string, valor: string): string {
  if (campo === "Status da Aeronave" && valor && valor !== "—") {
    return situacaoLabel(valor);
  }
  return valor;
}

function formatarRegistro(marcas: string, modelo: string | null, tipoIcao: string | null): string {
  const parts = [marcas];
  if (modelo || tipoIcao) {
    const icao = traduzirIcao(tipoIcao);
    if (modelo && icao) parts.push(`${modelo} (${icao})`);
    else if (icao) parts.push(icao);
    else if (modelo) parts.push(modelo);
  }
  return parts.join("  ");
}

function gerarXls(r: ResultadoComparacao): string {
  const h: string[] = [];
  h.push(`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`);
  h.push(`<head><meta charset="UTF-8">`);
  h.push(`<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>`);
  h.push(`<x:Name>Comparação RAB</x:Name>`);
  h.push(`<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>`);
  h.push(`</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`);
  h.push(`</head><body>`);

  // Resumo
  h.push(`<h2>Comparação RAB — ${r.base} → ${r.alvo}</h2>`);
  h.push(`<p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>`);
  h.push(`<table border="1" cellpadding="4" cellspacing="0">`);
  h.push(`<tr><th>Resumo</th><th>Quantidade</th></tr>`);
  h.push(`<tr><td>Registros novos</td><td>${r.resumo.novos}</td></tr>`);
  h.push(`<tr><td>Registros removidos</td><td>${r.resumo.removidos}</td></tr>`);
  h.push(`<tr><td>Registros alterados</td><td>${r.resumo.alterados}</td></tr>`);
  h.push(`<tr><td>Sem alteração</td><td>${r.resumo.semAlteracao}</td></tr>`);
  h.push(`</table><br/>`);

  // Registros novos
  if (r.novos.length > 0) {
    h.push(`<h3>Registros novos (${r.novos.length})</h3>`);
    h.push(`<table border="1" cellpadding="4" cellspacing="0">`);
    h.push(`<tr><th>Matrícula</th><th>Modelo</th><th>Fabricante</th><th>Tipo ICAO</th><th>Ano Fab.</th><th>Proprietários</th><th>Operadores</th></tr>`);
    for (const n of r.novos) {
      h.push(`<tr><td>${esc(n.marcas)}</td><td>${esc(n.modelo ?? "")}</td><td>${esc(n.fabricante ?? "")}</td><td>${esc(traduzirIcao(n.tipoIcao))}</td><td>${n.anoFabricacao || ""}</td><td>${esc(n.proprietarios.join(", "))}</td><td>${esc(n.operadores.join(", "))}</td></tr>`);
    }
    h.push(`</table><br/>`);
  }

  // Registros removidos
  if (r.removidos.length > 0) {
    h.push(`<h3>Registros removidos (${r.removidos.length})</h3>`);
    h.push(`<table border="1" cellpadding="4" cellspacing="0">`);
    h.push(`<tr><th>Matrícula</th><th>Modelo</th><th>Fabricante</th><th>Tipo ICAO</th><th>Ano Fab.</th><th>Proprietários</th><th>Operadores</th></tr>`);
    for (const rm of r.removidos) {
      h.push(`<tr><td>${esc(rm.marcas)}</td><td>${esc(rm.modelo ?? "")}</td><td>${esc(rm.fabricante ?? "")}</td><td>${esc(traduzirIcao(rm.tipoIcao))}</td><td>${rm.anoFabricacao || ""}</td><td>${esc(rm.proprietarios.join(", "))}</td><td>${esc(rm.operadores.join(", "))}</td></tr>`);
    }
    h.push(`</table><br/>`);
  }

  // Registros alterados
  if (r.alterados.length > 0) {
    h.push(`<h3>Registros alterados (${r.alterados.length})</h3>`);
    h.push(`<table border="1" cellpadding="4" cellspacing="0">`);
    h.push(`<tr><th>Matrícula</th><th>Modelo</th><th>Tipo ICAO</th><th>Ano Fab.</th><th>Campo</th><th>Antes</th><th>Depois</th></tr>`);
    for (const d of r.alterados) {
      if (d.campos.length === 0) {
        h.push(`<tr><td>${esc(d.marcas)}</td><td>${esc(d.modelo ?? "")}</td><td>${esc(traduzirIcao(d.tipoIcao))}</td><td>${d.anoFabricacao || ""}</td><td></td><td></td><td></td></tr>`);
      } else {
        for (const c of d.campos) {
          h.push(`<tr><td>${esc(d.marcas)}</td><td>${esc(d.modelo ?? "")}</td><td>${esc(traduzirIcao(d.tipoIcao))}</td><td>${d.anoFabricacao || ""}</td><td>${esc(c.campo)}</td><td>${esc(decodificarValor(c.campo, c.antes))}</td><td>${esc(decodificarValor(c.campo, c.depois))}</td></tr>`);
        }
      }
    }
    h.push(`</table>`);
  }

  h.push(`</body></html>`);
  return h.join("\n");
}

export async function GET(req: NextRequest) {
  await exigirSessao();
  const base = req.nextUrl.searchParams.get("base") ?? "";
  const alvo = req.nextUrl.searchParams.get("alvo") ?? "";
  const resultado = await compararPeriodos(base, alvo, 1, 1000000);
  const xls = gerarXls(resultado);
  return new NextResponse(xls, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="comparacao-rab-${base}-${alvo}.xls"`,
    },
  });
}
