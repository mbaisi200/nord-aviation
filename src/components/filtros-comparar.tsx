"use client";

import { ArrowLeftRight, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui";
import { MultiSelectFiltro } from "@/components/multi-select-filtro";

const SK = "comparar-filtros";

function salvarFiltrosDoForm(form: HTMLFormElement) {
  if (typeof window === "undefined") return;
  const fd = new FormData(form);
  const q = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && v.trim()) {
      q.append(k, v.trim());
    }
  }
  if (q.toString()) {
    localStorage.setItem(SK, q.toString());
  }
}

function lerDoStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SK);
  } catch {
    return null;
  }
}

const OPCOES_SITUACAO = [
  { v: "N", r: "Situação normal" },
  { v: "R", r: "Reserva de marcas" },
  { v: "S", r: "CA suspenso" },
  { v: "C", r: "CA cancelado" },
  { v: "V", r: "CA vencido" },
  { v: "X", r: "Aeronave interditada" },
  { v: "U", r: "Ultraleve (normal)" },
  { v: "Z", r: "Experimental (normal)" },
  { v: "P", r: "Situação punitiva" },
  { v: "M", r: "Matrícula cancelada" },
];

const OPCOES_TP_MOTOR = [
  "MOTOR CONVENCIONAL", "MOTOR JATO/TURBOFAN", "MOTOR TURBOHELICE",
  "MOTOR TURBOEIXO", "MOTOR A PISTÃO", "MOTOR ELETRICO", "SEM MOTOR", "DRONE",
];

const OPCOES_QT_MOTOR = ["0", "1", "2", "3", "4"];

const OPCOES_TP_POUSO = [
  "POUSO CONVENCIONAL", "HELICOPTERO", "ANFIBIO", "GIROCOPTERO",
  "POUSO EM TERRA", "POUSO NA AGUA", "DRONE (RPAS)",
];

const OPCOES_TP_CA = [
  "CA PADRAO", "CAVE", "AEV", "CEALE", "APO", "CAER", "APO+CAVE", "CAARF",
];

const OPCOES_CF_OPERACIONAL = ["RBAC 91", "RBAC 135", "RBAC 121", "RBAC E94"];

const OPCOES_CATEGORIA = [
  "NORMAL", "TRANSPORTE", "RESTRITA", "UTILIDADE", "RPAS AUTORIZADO",
];

const OPCOES_TP_OPERACAO = [
  "PRIVADO", "PRIVADA", "PUBLICO", "PUBLICO ESTADUAL", "PUBLICO FEDERAL",
  "PUBLICO MUNICIPAL", "PUBLICO DISTRITO FEDERAL",
];

type AF = {
  fabricante?: string[]; modelo?: string[]; situacao?: string[];
  tpMotor?: string[]; qtMotor?: string[]; tpPouso?: string[];
  tpCa?: string[]; cfOperacional?: string[]; categoria?: string[];
  tpOperacao?: string[]; anoDe?: string; anoAte?: string;
};

function fmt(p: string) {
  const [ano, mes] = p.split("-");
  const m = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${m[Number(mes) - 1]} de ${ano}`;
}

export function FiltrosComparar({
  periodos, base, alvo, valores, fabricantes, modelos,
}: {
  periodos: string[]; base?: string; alvo?: string;
  valores: AF; fabricantes?: string[]; modelos?: string[];
}) {
  const router = useRouter();
  const restaurado = useRef(false);
  const temFiltros = Object.values(valores).some((v) =>
    Array.isArray(v) ? v.length > 0 : !!v,
  );

  // Restaura filtros do storage se a URL não tem filtros
  useEffect(() => {
    if (restaurado.current) return;
    restaurado.current = true;
    if (!temFiltros) {
      const qs = lerDoStorage();
      if (qs) {
        router.replace(`/comparar?${qs}`);
      }
    }
  }, []);

  function handlePeriodoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (typeof window !== "undefined" && e.currentTarget.form) {
      salvarFiltrosDoForm(e.currentTarget.form);
    }
    e.currentTarget.form?.requestSubmit();
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-semibold">Filtros de aeronave</span>
        {temFiltros || base || alvo ? (
          <Link
            href="/comparar"
            onClick={() => { if (typeof window !== "undefined") localStorage.removeItem(SK); }}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Link>
        ) : null}
      </div>
      <form
        method="GET"
        action="/comparar"
        onSubmit={(e) => { if (typeof window !== "undefined") salvarFiltrosDoForm(e.currentTarget); }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MultiSelectFiltro nome="fabricante" rotulo="Fabricante" opcoes={fabricantes ?? []} selecionados={valores.fabricante} />
          <MultiSelectFiltro nome="modelo" rotulo="Modelo" opcoes={modelos ?? []} selecionados={valores.modelo} />
          <MultiSelectFiltro nome="situacao" rotulo="Situação" opcoes={OPCOES_SITUACAO} selecionados={valores.situacao} />
          <MultiSelectFiltro nome="tpMotor" rotulo="Tipo de motor" opcoes={OPCOES_TP_MOTOR} selecionados={valores.tpMotor} />
          <MultiSelectFiltro nome="qtMotor" rotulo="Qtde. de motores" opcoes={OPCOES_QT_MOTOR} selecionados={valores.qtMotor} />
          <MultiSelectFiltro nome="tpPouso" rotulo="Tipo de pouso" opcoes={OPCOES_TP_POUSO} selecionados={valores.tpPouso} />
          <MultiSelectFiltro nome="tpCa" rotulo="Tipo de CA" opcoes={OPCOES_TP_CA} selecionados={valores.tpCa} />
          <MultiSelectFiltro nome="cfOperacional" rotulo="CF operacional" opcoes={OPCOES_CF_OPERACIONAL} selecionados={valores.cfOperacional} />
          <MultiSelectFiltro nome="categoria" rotulo="Categoria de homologação" opcoes={OPCOES_CATEGORIA} selecionados={valores.categoria} />
          <MultiSelectFiltro nome="tpOperacao" rotulo="Tipo de operação" opcoes={OPCOES_TP_OPERACAO} selecionados={valores.tpOperacao} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ano de fabricação de" htmlFor="f-anoDe">
              <Input id="f-anoDe" name="anoDe" type="number" min={1900} max={2100} defaultValue={valores.anoDe} placeholder="Ex.: 2000" />
            </Field>
            <Field label="até" htmlFor="f-anoAte">
              <Input id="f-anoAte" name="anoAte" type="number" min={1900} max={2100} defaultValue={valores.anoAte} placeholder="Ex.: 2020" />
            </Field>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Período base (antes)
              <select name="base" defaultValue={base ?? periodos[1] ?? periodos[0]} onChange={handlePeriodoChange}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {periodos.map((p) => <option key={p} value={p}>{fmt(p)}</option>)}
              </select>
            </label>
            <ArrowLeftRight className="mb-2.5 h-4 w-4 text-zinc-400" />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Período comparativo (depois)
              <select name="alvo" defaultValue={alvo ?? periodos[0]} onChange={handlePeriodoChange}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {periodos.map((p) => <option key={p} value={p}>{fmt(p)}</option>)}
              </select>
            </label>
          </div>
        </div>

        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-[15px] font-semibold text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-sky-600/30">
          <SlidersHorizontal className="h-4 w-4" />
          Aplicar filtros
        </button>
      </form>
    </div>
  );
}
