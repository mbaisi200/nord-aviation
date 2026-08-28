"use client";

import { SlidersHorizontal, X, FileSpreadsheet, FileText, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field, Input, Select } from "@/components/ui";
import type { FiltrosAeronaves } from "@/app/actions/aeronaves";
import { MultiSelectFiltro } from "@/components/multi-select-filtro";
import { exportarXls, exportarPdf } from "@/app/actions/aeronaves";

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
  "MOTOR CONVENCIONAL",
  "MOTOR JATO/TURBOFAN",
  "MOTOR TURBOHELICE",
  "MOTOR TURBOEIXO",
  "MOTOR A PISTÃO",
  "MOTOR ELETRICO",
  "SEM MOTOR",
  "DRONE",
];

const OPCOES_QT_MOTOR = ["0", "1", "2", "3", "4"];

const OPCOES_TP_POUSO = [
  "POUSO CONVENCIONAL",
  "HELICOPTERO",
  "ANFIBIO",
  "GIROCOPTERO",
  "POUSO EM TERRA",
  "POUSO NA AGUA",
  "DRONE (RPAS)",
];

const OPCOES_TP_CA = [
  "CA PADRAO",
  "CAVE",
  "AEV",
  "CEALE",
  "APO",
  "CAER",
  "APO+CAVE",
  "CAARF",
];

const OPCOES_CF_OPERACIONAL = [
  "RBAC 91",
  "RBAC 135",
  "RBAC 121",
  "RBAC E94",
];

const OPCOES_CATEGORIA = [
  "NORMAL",
  "TRANSPORTE",
  "RESTRITA",
  "UTILIDADE",
  "NORMAL/RESTRITA",
  "NORMAL/UTILIDADE",
  "NÃO CERTIFICADA",
  "TRANSP.REGIONAL",
  "TRANSPORTE A/B",
  "RPAS AUTORIZADO",
  "NORMAL/ACROBATICA",
  "TRANSPORTE B",
  "ACROBATICA",
  "TRANSPORTE A",
  "PRIMARIA",
  "SEMI ACROBATICA",
  "CLASSE ESPECIAL",
  "ACROB./RESTRITA",
  "UTIL./ACROBATICA",
  "NORMAL/S.ACROB.",
  "UTILIDADE/S.ACROB",
  "NORMAL/UT./REST.",
];

const OPCOES_TP_OPERACAO = [
  "PRIVADO",
  "PUBLICO ESTADUAL",
  "PUBLICO FEDERAL",
  "PRIVADA",
  "PUBLICO DISTRITO FEDERAL",
  "PUBLICO MUNICIPAL",
  "PUBLICA ESTADUAL",
  "PUBLICO",
];

const OPCOES_ORDENACAO = [
  { v: "matricula_desc", r: "Data de matrícula (recente primeiro)" },
  { v: "matricula_asc", r: "Data de matrícula (antigo primeiro)" },
  { v: "marcas_asc", r: "Prefixo (A → Z)" },
  { v: "marcas_desc", r: "Prefixo (Z → A)" },
  { v: "modelo_asc", r: "Modelo (A → Z)" },
  { v: "modelo_desc", r: "Modelo (Z → A)" },
  { v: "fabricante_asc", r: "Fabricante (A → Z)" },
  { v: "fabricante_desc", r: "Fabricante (Z → A)" },
  { v: "ano_desc", r: "Ano de fabricação (recente primeiro)" },
  { v: "ano_asc", r: "Ano de fabricação (antigo primeiro)" },
];

function filtrosParaExport(valores: FiltrosAeronaves) {
  return {
    situacao: valores.situacao,
    fabricante: valores.fabricante,
    modelo: valores.modelo,
    tpMotor: valores.tpMotor,
    qtMotor: valores.qtMotor,
    tpPouso: valores.tpPouso,
    tpCa: valores.tpCa,
    cfOperacional: valores.cfOperacional,
    categoria: valores.categoria,
    tpOperacao: valores.tpOperacao,
    anoDe: valores.anoDe,
    anoAte: valores.anoAte,
    proprietario: valores.proprietario,
    operador: valores.operador,
    ufProprietario: valores.ufProprietario,
    ufOperador: valores.ufOperador,
  };
}

export function FiltrosAeronaves({
  valores,
  ativos,
  fabricantes,
  modelos,
  ufsProprietarios,
  ufsOperadores,
  termoBusca,
}: {
  valores: FiltrosAeronaves;
  ativos: boolean;
  fabricantes?: string[];
  modelos?: string[];
  ufsProprietarios?: string[];
  ufsOperadores?: string[];
  termoBusca?: string;
}) {
  const [exportando, setExportando] = useState<"xls" | "pdf" | null>(null);

  async function handleExportXls() {
    setExportando("xls");
    try {
      const { xml } = await exportarXls(termoBusca ?? "", filtrosParaExport(valores));
      const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aeronaves_${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(null);
    }
  }

  async function handleExportPdf() {
    setExportando("pdf");
    try {
      const { html } = await exportarPdf(termoBusca ?? "", filtrosParaExport(valores));
      const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setExportando(null);
    }
  }

  return (
    <CardFiltros ativos={ativos}>
      <form action="/aeronaves" className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MultiSelectFiltro
            nome="fabricante"
            rotulo="Fabricante"
            opcoes={fabricantes ?? []}
            selecionados={valores.fabricante}
          />
          <MultiSelectFiltro
            nome="modelo"
            rotulo="Modelo"
            opcoes={modelos ?? []}
            selecionados={valores.modelo}
          />
          <MultiSelectFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={OPCOES_SITUACAO}
            selecionados={valores.situacao}
          />
          <MultiSelectFiltro
            nome="tpMotor"
            rotulo="Tipo de motor"
            opcoes={OPCOES_TP_MOTOR}
            selecionados={valores.tpMotor}
          />
          <MultiSelectFiltro
            nome="qtMotor"
            rotulo="Qtde. de motores"
            opcoes={OPCOES_QT_MOTOR}
            selecionados={valores.qtMotor}
          />
          <MultiSelectFiltro
            nome="tpPouso"
            rotulo="Tipo de pouso"
            opcoes={OPCOES_TP_POUSO}
            selecionados={valores.tpPouso}
          />
          <MultiSelectFiltro
            nome="tpCa"
            rotulo="Tipo de CA"
            opcoes={OPCOES_TP_CA}
            selecionados={valores.tpCa}
          />
          <MultiSelectFiltro
            nome="cfOperacional"
            rotulo="CF operacional"
            opcoes={OPCOES_CF_OPERACIONAL}
            selecionados={valores.cfOperacional}
          />
          <MultiSelectFiltro
            nome="categoria"
            rotulo="Categoria de homologação"
            opcoes={OPCOES_CATEGORIA}
            selecionados={valores.categoria}
          />
          <MultiSelectFiltro
            nome="tpOperacao"
            rotulo="Tipo de operação"
            opcoes={OPCOES_TP_OPERACAO}
            selecionados={valores.tpOperacao}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ano de fabricação de" htmlFor="f-anoDe">
              <Input
                id="f-anoDe"
                name="anoDe"
                type="number"
                min={1900}
                max={2100}
                defaultValue={valores.anoDe}
                placeholder="Ex.: 2000"
              />
            </Field>
            <Field label="até" htmlFor="f-anoAte">
              <Input
                id="f-anoAte"
                name="anoAte"
                type="number"
                min={1900}
                max={2100}
                defaultValue={valores.anoAte}
                placeholder="Ex.: 2020"
              />
            </Field>
          </div>
          <Field label="Proprietário" htmlFor="f-proprietario">
            <Input
              id="f-proprietario"
              name="proprietario"
              defaultValue={valores.proprietario}
              placeholder="Nome do proprietário"
            />
          </Field>
          <MultiSelectFiltro
            nome="ufProprietario"
            rotulo="UF Proprietário"
            opcoes={ufsProprietarios ?? []}
            selecionados={valores.ufProprietario}
          />
          <Field label="Operador" htmlFor="f-operador">
            <Input
              id="f-operador"
              name="operador"
              defaultValue={valores.operador}
              placeholder="Nome do operador"
            />
          </Field>
          <MultiSelectFiltro
            nome="ufOperador"
            rotulo="UF Operador"
            opcoes={ufsOperadores ?? []}
            selecionados={valores.ufOperador}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Field label="Ordenar por" htmlFor="f-ordenacao">
              <Select
                id="f-ordenacao"
                name="ordenacao"
                defaultValue={valores.ordenacao ?? "matricula_desc"}
              >
                {OPCOES_ORDENACAO.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <button
            type="button"
            onClick={handleExportXls}
            disabled={exportando !== null}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportando === "xls" ? "Exportando..." : "Exportar XLS"}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportando !== null}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileText className="h-4 w-4" />
            {exportando === "pdf" ? "Exportando..." : "Exportar PDF"}
          </button>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-[15px] font-semibold text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-sky-600/30 sm:ml-auto"
          >
            <ArrowUpDown className="h-4 w-4" />
            Aplicar filtros
          </button>
        </div>
      </form>
    </CardFiltros>
  );
}

function CardFiltros({
  ativos,
  children,
}: {
  ativos: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-semibold">Filtros</span>
        {ativos ? (
          <Link
            href="/aeronaves"
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}
