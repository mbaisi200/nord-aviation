"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { situacaoLabel } from "@/lib/aeronave";
import { traduzirIcao } from "@/lib/icao-types";
import { formatarData, formatarNumero } from "@/lib/format";
import type { NovoDetalhado } from "@/app/actions/comparar";

export function CardNovo({ r }: { r: NovoDetalhado }) {
  const [aberto, setAberto] = useState(false);
  const cdInterdicao = (r as unknown as { cdInterdicao: string | null }).cdInterdicao;
  const campos: { rotulo: string; valor: React.ReactNode }[] = [
    { rotulo: "Matrícula", valor: r.marcas },
    { rotulo: "Modelo", valor: r.modelo },
    { rotulo: "Fabricante", valor: r.fabricante },
    { rotulo: "Nº certificado", valor: (r as unknown as { nrCertMatricula: number | null }).nrCertMatricula },
    { rotulo: "Nº série", valor: (r as unknown as { nrSerie: string | null }).nrSerie },
    { rotulo: "Código tipo", valor: (r as unknown as { cdTipo: string | null }).cdTipo },
    { rotulo: "Classe", valor: (r as unknown as { cdCls: string | null }).cdCls },
    { rotulo: "Tipo ICAO", valor: r.tipoIcao ? `${r.tipoIcao}${r.tipoIcaoNome ? ` (${r.tipoIcaoNome})` : r.tipoIcao ? ` (${traduzirIcao(r.tipoIcao)})` : ""}` : null },
    { rotulo: "PMD (kg)", valor: formatarNumero((r as unknown as { nrPmd: string | null }).nrPmd ?? null) },
    { rotulo: "Tripulação min", valor: (r as unknown as { nrTripulacaoMin: number | null }).nrTripulacaoMin },
    { rotulo: "Passageiros máx", valor: (r as unknown as { nrPassageirosMax: number | null }).nrPassageirosMax },
    { rotulo: "Assentos", valor: (r as unknown as { nrAssentos: number | null }).nrAssentos },
    { rotulo: "Ano fabricação", valor: r.anoFabricacao },
    { rotulo: "Validade CVA", valor: (r as unknown as { dtValidadeCva: string | null }).dtValidadeCva },
    { rotulo: "Validade CA", valor: formatarData((r as unknown as { dtValidadeCa: Date | null }).dtValidadeCa as unknown as Date | null) },
    { rotulo: "Data matrícula", valor: formatarData((r as unknown as { dtMatricula: Date | null }).dtMatricula as unknown as Date | null) },
    { rotulo: "Cancelamento", valor: formatarData((r as unknown as { dtCanc: Date | null }).dtCanc as unknown as Date | null) },
    { rotulo: "Motivo canc.", valor: (r as unknown as { dsMotivoCanc: string | null }).dsMotivoCanc },
    { rotulo: "Gravame", valor: (r as unknown as { dsGravame: string | null }).dsGravame },
    { rotulo: "Tipo motor", valor: (r as unknown as { tpMotor: string | null }).tpMotor },
    { rotulo: "Qtde motores", valor: (r as unknown as { qtMotor: number | null }).qtMotor },
    { rotulo: "Tipo pouso", valor: (r as unknown as { tpPouso: string | null }).tpPouso },
    { rotulo: "Tipo CA", valor: (r as unknown as { tpCa: string | null }).tpCa },
    { rotulo: "Propósito CAVE", valor: (r as unknown as { cdPropositoCave: string | null }).cdPropositoCave },
    { rotulo: "CF operacional", valor: (r as unknown as { cfOperacional: string | null }).cfOperacional },
    { rotulo: "Categoria", valor: (r as unknown as { dsCategoriaHomologacao: string | null }).dsCategoriaHomologacao },
    { rotulo: "Tipo operação", valor: (r as unknown as { tpOperacao: string | null }).tpOperacao },
    { rotulo: "Situação", valor: cdInterdicao ? situacaoLabel(cdInterdicao) : null },
    { rotulo: "Proprietários", valor: r.proprietarios.length ? r.proprietarios.join(", ") : null },
    { rotulo: "Operadores", valor: r.operadores.length ? r.operadores.join(", ") : null },
  ];

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-base font-bold tracking-wider text-emerald-600 dark:text-emerald-400">{r.marcas}</span>
          {r.modelo ? <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{r.modelo}</span> : null}
          {r.fabricante ? <span className="hidden text-xs text-zinc-400 sm:inline">· {r.fabricante}</span> : null}
          {cdInterdicao ? <Badge className="ml-1 hidden border-emerald-200 bg-emerald-100 text-emerald-700 sm:inline-flex">{situacaoLabel(cdInterdicao)}</Badge> : null}
        </span>
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="hidden sm:inline">{aberto ? "recolher" : "ver detalhes"}</span>
          {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {aberto ? (
        <div className="border-t border-emerald-200 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2 bg-emerald-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Ficha completa — {cdInterdicao === "R" ? "7 campos preenchidos pela ANAC para Reserva" : "informações novas destacadas em verde"}
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-0 divide-y divide-emerald-100 dark:divide-emerald-900 sm:grid-cols-2 lg:grid-cols-3">
            {campos
              .filter((c) => {
                const temValor = !!c.valor && c.valor !== "—";
                // Para Reserva (R) oculta os — para não parecer faltando - só mostra o que a ANAC enviou
                if (cdInterdicao === "R" && !temValor) return false;
                return true;
              })
              .map((c) => {
                const temValor = !!c.valor && c.valor !== "—";
                return (
                  <div
                    key={c.rotulo}
                    className={`flex flex-col px-4 py-2 ${temValor ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-l-2 border-emerald-400" : "bg-zinc-50/30 dark:bg-zinc-900/20 opacity-60"}`}
                  >
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${temValor ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-400"}`}>{c.rotulo}</span>
                    <span className={`truncate text-xs font-semibold ${temValor ? "text-emerald-900 dark:text-emerald-100" : "text-zinc-500 dark:text-zinc-400"}`}>{c.valor || "—"}</span>
                  </div>
                );
              })}
          </div>
          <div className="flex justify-end border-t border-emerald-200 bg-emerald-50/50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
            <Link href={`/aeronaves/${r.marcas}`} className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300">
              abrir cadastro completo →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 pb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {r.tipoIcao ? <span>ICAO: {r.tipoIcaoNome ?? traduzirIcao(r.tipoIcao)}</span> : null}
          {r.anoFabricacao ? <span>Ano: {r.anoFabricacao}</span> : null}
          {r.proprietarios.length > 0 ? <span>Prop.: {r.proprietarios.join(", ")}</span> : null}
          {r.operadores.length > 0 ? <span>Op.: {r.operadores.join(", ")}</span> : null}
        </div>
      )}
    </Card>
  );
}
