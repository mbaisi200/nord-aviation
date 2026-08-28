import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  FileSpreadsheet,
  Printer,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { VerTodosButton } from "@/components/ver-todos-button";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { Barra } from "@/components/barra-comparacao";
import { CardResumo } from "@/components/card-resumo-comparacao";
import { ModalRelatorio } from "@/components/modal-relatorio";
import { situacaoLabel } from "@/lib/aeronave";
import { traduzirIcao } from "@/lib/icao-types";
import { CardNovo } from "@/components/card-novo";
import {
  compararMatricula,
  compararPeriodos,
  listarPeriodos,
} from "@/app/actions/comparar";
import { listarFabricantes, listarModelos } from "@/app/actions/aeronaves";
import { AutoImprimir } from "@/components/auto-imprimir";
import { FiltrosComparar } from "@/components/filtros-comparar";

export const metadata = {
  title: "Comparar períodos do RAB",
};

function formatarRegistro(marcas: string, modelo: string | null, tipoIcao: string | null, operadores?: string[], proprietarios?: string[], anoFabricacao?: number | null, fabricante?: string | null, tipoIcaoNome?: string | null): React.ReactNode {
  const icao = tipoIcaoNome ?? traduzirIcao(tipoIcao);
  const detalhes = [modelo, fabricante, icao && icao !== modelo ? `(${icao})` : null, anoFabricacao ? String(anoFabricacao) : null].filter(Boolean).join(" ");
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono font-bold tracking-wider">{marcas}</span>
      {detalhes ? (
        <span className="text-xs text-purple-500 dark:text-purple-400">{detalhes}</span>
      ) : null}
      {proprietarios && proprietarios.length > 0 ? (
        <span className="text-xs text-zinc-400">· {proprietarios.join(", ")}</span>
      ) : null}
      {operadores && operadores.length > 0 ? (
        <span className="text-xs text-zinc-400">· {operadores.join(", ")}</span>
      ) : null}
    </span>
  );
}

function decodificarValor(campo: string, valor: string): string {
  if (campo === "Status da Aeronave" && valor && valor !== "—") {
    return situacaoLabel(valor);
  }
  return valor;
}

function formatarPeriodo(p: string): string {
  const [ano, mes] = p.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${meses[Number(mes) - 1]} de ${ano}`;
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{
    base?: string;
    alvo?: string;
    pagina?: string;
    imprimir?: string;
    matricula?: string;
    pb?: string;
    pa?: string;
    campo?: string;
    fabricante?: string;
    tipo?: string;
    relatorio?: string;
    // Filtros de aeronave
    modelo?: string;
    situacao?: string;
    tpMotor?: string;
    qtMotor?: string;
    tpPouso?: string;
    tpCa?: string;
    cfOperacional?: string;
    categoria?: string;
    tpOperacao?: string;
    anoDe?: string;
    anoAte?: string;
  }>;
}) {
  const params = await searchParams;

  function extrairArray(valor: string | string[] | undefined): string[] | undefined {
    if (Array.isArray(valor)) {
      const arr = valor.map((v) => v.trim()).filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    }
    if (typeof valor === "string" && valor.trim()) return [valor.trim()];
    return undefined;
  }

  const CAMPOS_FILTRO_URL = [
    "fabricante", "modelo", "situacao", "tpMotor", "qtMotor",
    "tpPouso", "tpCa", "cfOperacional", "categoria", "tpOperacao",
    "anoDe", "anoAte",
  ] as const;

  function filtrosAtivosEntries(): [string, string][] {
    const entries: [string, string][] = [];
    for (const c of CAMPOS_FILTRO_URL) {
      const v = params[c];
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item.trim()) entries.push([c, item.trim()]);
        }
      } else if (typeof v === "string" && v.trim()) {
        entries.push([c, v.trim()]);
      }
    }
    return entries;
  }

  function hrefComparar(extras: Record<string, string | string[]> = {}): string {
    const base_ = base ?? params.base ?? "";
    const alvo_ = alvo ?? params.alvo ?? "";
    const q = new URLSearchParams();
    if (base_) q.set("base", base_);
    if (alvo_) q.set("alvo", alvo_);
    // Primeiro: filtros de aeronave
    for (const [k, v] of filtrosAtivosEntries()) {
      q.append(k, v);
    }
    // Depois: extras — se a key já existe, remove antes de adicionar o novo valor
    for (const [k, v] of Object.entries(extras)) {
      if (v) {
        q.delete(k);
        if (Array.isArray(v)) {
          for (const item of v) q.append(k, item);
        } else {
          q.set(k, v);
        }
      }
    }
    const qs = q.toString();
    return `/comparar${qs ? `?${qs}` : ""}`;
  }

  const imprimir = params.imprimir === "1";
  const abrirRelatorio = params.relatorio === "1" && !imprimir;

  const campoFiltro = params.campo || undefined;
  const tipoFiltro = params.tipo === "novos" || params.tipo === "removidos" || params.tipo === "alterados" ? params.tipo : undefined;
  const tipoLabelMap: Record<string, string> = { novos: "Novos", removidos: "Removidos", alterados: "Alterados" };
  // fabricanteFiltro: só quando é drill-down (tipo/campo presentes) E fabricante é string única (não array de filtros)
  const fabricanteFiltro = (tipoFiltro || campoFiltro) && typeof params.fabricante === "string" ? params.fabricante : undefined;
  const temFiltroDrillDown = !!(campoFiltro || fabricanteFiltro || tipoFiltro);

  const aeroFiltros = {
    fabricante: extrairArray(params.fabricante),
    modelo: extrairArray(params.modelo),
    situacao: extrairArray(params.situacao),
    tpMotor: extrairArray(params.tpMotor),
    qtMotor: extrairArray(params.qtMotor),
    tpPouso: extrairArray(params.tpPouso),
    tpCa: extrairArray(params.tpCa),
    cfOperacional: extrairArray(params.cfOperacional),
    categoria: extrairArray(params.categoria),
    tpOperacao: extrairArray(params.tpOperacao),
    anoDe: params.anoDe || undefined,
    anoAte: params.anoAte || undefined,
  };
  const temFiltrosAero = Object.values(aeroFiltros).some((v) => Array.isArray(v) ? v.length > 0 : !!v);

  const periodoBase = params.base && /^\d{4}-\d{2}$/.test(params.base) ? params.base : undefined;
  const periodoAlvo = params.alvo && /^\d{4}-\d{2}$/.test(params.alvo) ? params.alvo : undefined;

  // Pré-busca: listarPeriodos + compararPeriodos BASE em paralelo
  // Sempre busca compararPeriodos (sem filtros) se base/alvo válidos
  const [periodos, resultadoBase, fabricantes, modelos] = await Promise.all([
    listarPeriodos(),
    periodoBase && periodoAlvo && !imprimir
      ? compararPeriodos(periodoBase, periodoAlvo, 1, 50, {})
      : Promise.resolve(null),
    listarFabricantes(),
    listarModelos(),
  ]);

  const base = periodoBase && periodos.includes(periodoBase) ? periodoBase : undefined;
  const alvo = periodoAlvo && periodos.includes(periodoAlvo) ? periodoAlvo : undefined;
  const temComparacao = base && alvo;

  const matricula =
    params.matricula && /^[a-zA-Z0-9-]+$/.test(params.matricula)
      ? params.matricula.trim().toUpperCase()
      : undefined;
  const pb = params.pb && periodos.includes(params.pb) ? params.pb : undefined;
  const pa = params.pa && periodos.includes(params.pa) ? params.pa : undefined;
  const resultadoMatricula =
    matricula && pb && pa && !imprimir
      ? await compararMatricula(matricula, pb, pa)
      : null;

  // drillDownFab: array single para drill-down por fabricante (quando tipo/campo presentes)
  const drillDownFab = fabricanteFiltro ? [fabricanteFiltro] : undefined;

  // Merge dos filtros: quando há drill-down, fabricante do drill-down substitui o filtro de fabricante
  const filtrosMergeados = {
    ...aeroFiltros,
    ...(temFiltroDrillDown ? { fabricante: drillDownFab ?? aeroFiltros.fabricante, campo: campoFiltro, tipo: tipoFiltro } : {}),
  } satisfies import("@/app/actions/comparar").FiltrosComparacao;

  const [resultadoRelatorio, resultado] = await Promise.all([
    abrirRelatorio && base && alvo && temFiltroDrillDown
      ? compararPeriodos(base, alvo, 1, 1000000, filtrosMergeados)
      : Promise.resolve(null),
    resultadoBase && !temFiltrosAero && !temFiltroDrillDown
      ? resultadoBase
      : base && alvo
        ? compararPeriodos(base, alvo, imprimir ? 1 : 1, imprimir ? 1000000 : 50, filtrosMergeados)
        : Promise.resolve(null),
  ]);

  return (
    <AppShell>
      {imprimir && resultado ? <AutoImprimir /> : null}
      <div className="flex flex-col gap-4">
        {!imprimir ? (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Comparar períodos
            </h1>
            <p className="text-sm text-zinc-500">
              Compare dois meses do RAB e veja o que mudou nas aeronaves,
              proprietários e operadores.
            </p>
          </div>
        ) : null}

        {/* Filtros de aeronave + períodos */}
        {!imprimir ? (
          <Card className="p-4">
            <FiltrosComparar
              periodos={periodos}
              base={base}
              alvo={alvo}
              valores={aeroFiltros}
              fabricantes={fabricantes}
              modelos={modelos}
            />
          </Card>
        ) : null}

        {!imprimir ? (
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <p className="font-semibold">Comparar matrícula específica</p>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Veja a situação anterior e a atual de uma aeronave entre dois
              períodos.
            </p>
            <form
              method="GET"
              action="/comparar"
              className="mt-3 flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Matrícula
                <input
                  name="matricula"
                  defaultValue={matricula}
                  placeholder="Ex.: PT-ABC"
                  autoComplete="off"
                  className="h-10 rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm uppercase tracking-wider text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Período anterior
                  <select
                    name="pb"
                    defaultValue={pb ?? periodos[1] ?? periodos[0]}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {periodos.map((p) => (
                      <option key={p} value={p}>
                        {formatarPeriodo(p)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Período atual
                  <select
                    name="pa"
                    defaultValue={pa ?? periodos[0]}
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {periodos.map((p) => (
                      <option key={p} value={p}>
                        {formatarPeriodo(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button type="submit">
                <Search className="h-4 w-4" />
                Ver situação
              </Button>
            </form>
          </Card>
        ) : null}

        {resultadoMatricula ? (
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-wider text-sky-600 dark:text-sky-400">
                  {resultadoMatricula.marcas}
                </span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {formatarPeriodo(resultadoMatricula.base)}
                </span>
                <ArrowLeftRight className="h-4 w-4 text-zinc-400" />
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {formatarPeriodo(resultadoMatricula.alvo)}
                </span>
              </div>
              {!resultadoMatricula.existeBase || !resultadoMatricula.existeAlvo ? (
                <Badge className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Não constava em um dos períodos
                </Badge>
              ) : null}
            </div>

            {!resultadoMatricula.existeBase && !resultadoMatricula.existeAlvo ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                Esta matrícula não foi encontrada em nenhum dos períodos
                selecionados.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>Campo</span>
                  <span>{resultadoMatricula.existeBase ? "Antes" : "—"}</span>
                  <span>{resultadoMatricula.existeAlvo ? "Depois" : "—"}</span>
                </div>
                {resultadoMatricula.campos.map((c) => (
                  <div
                    key={c.rotulo}
                    className={`grid grid-cols-3 gap-2 px-4 py-2.5 text-sm ${
                      c.mudou ? "bg-amber-50/60 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      {c.rotulo}
                    </span>
                    <span
                      className={`${
                        c.mudou
                          ? "text-zinc-400 line-through decoration-red-400/60"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {resultadoMatricula.existeBase ? c.antes : "—"}
                    </span>
                    <span
                      className={`font-medium ${
                        c.mudou
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {resultadoMatricula.existeAlvo ? c.depois : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        {!imprimir && periodos.length < 2 ? (
          <Card className="flex flex-col gap-2 p-4 text-sm text-zinc-500">
            <span>
              Ainda só existe um período importado. Quando o próximo arquivo
              mensal do RAB for importado, você poderá comparar os meses aqui.
            </span>
            <Link
              href="/importar"
              className="inline-flex items-center gap-1 font-semibold text-sky-600 underline underline-offset-2 dark:text-sky-400"
            >
              Importar novo mês agora <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ) : null}

        {temComparacao && resultado ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {formatarPeriodo(resultado.base)}
                </span>
                <ArrowLeftRight className="h-4 w-4 text-zinc-400" />
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {formatarPeriodo(resultado.alvo)}
                </span>
                {temFiltroDrillDown ? (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <VerTodosButton
                      href={hrefComparar()}
                      label={campoFiltro ? campoFiltro : fabricanteFiltro ? fabricanteFiltro : tipoLabelMap[tipoFiltro ?? ""]}
                    />
                  </>
                ) : null}
              </div>
              {!imprimir ? (
                <div className="flex gap-2 print:hidden">
                  <LinkButton
                    href={hrefComparar({ imprimir: "1" })}
                    variant="secondary"
                  >
                    <Printer className="h-4 w-4" />
                    Exportar PDF
                  </LinkButton>
                  <LinkButton
                    href={`/api/exportar?base=${resultado.base}&alvo=${resultado.alvo}`}
                    variant="secondary"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar XLS
                  </LinkButton>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CardResumo
                tipo="novos"
                icone="plus"
                cor="text-emerald-500"
                rotulo="novos"
                quantidade={resultado.resumo.novos}
                href={hrefComparar({ relatorio: "1", tipo: "novos" })}
              />
              <CardResumo
                tipo="removidos"
                icone="minus"
                cor="text-red-500"
                rotulo="removidos"
                quantidade={resultado.resumo.removidos}
                href={hrefComparar({ relatorio: "1", tipo: "removidos" })}
              />
              <CardResumo
                tipo="alterados"
                icone="refresh"
                cor="text-amber-500"
                rotulo="alterados"
                quantidade={resultado.resumo.alterados}
                href={hrefComparar({ relatorio: "1", tipo: "alterados" })}
              />
              <CardResumo
                tipo="sem"
                icone="check"
                cor="text-sky-500"
                rotulo="sem alteração"
                quantidade={resultado.resumo.semAlteracao}
              />
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Visão geral das mudanças
              </h2>

              <Card className="p-4">
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {resultado.resumo.novos > 0 ? (
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${(resultado.resumo.novos / Math.max(1, resultado.resumo.novos + resultado.resumo.removidos + resultado.resumo.alterados + resultado.resumo.semAlteracao)) * 100}%`,
                      }}
                    />
                  ) : null}
                  {resultado.resumo.removidos > 0 ? (
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(resultado.resumo.removidos / Math.max(1, resultado.resumo.novos + resultado.resumo.removidos + resultado.resumo.alterados + resultado.resumo.semAlteracao)) * 100}%`,
                      }}
                    />
                  ) : null}
                  {resultado.resumo.alterados > 0 ? (
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${(resultado.resumo.alterados / Math.max(1, resultado.resumo.novos + resultado.resumo.removidos + resultado.resumo.alterados + resultado.resumo.semAlteracao)) * 100}%`,
                      }}
                    />
                  ) : null}
                  {resultado.resumo.semAlteracao > 0 ? (
                    <div
                      className="bg-zinc-300 dark:bg-zinc-600"
                      style={{
                        width: `${(resultado.resumo.semAlteracao / Math.max(1, resultado.resumo.novos + resultado.resumo.removidos + resultado.resumo.alterados + resultado.resumo.semAlteracao)) * 100}%`,
                      }}
                    />
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-4">
                  {[
                    { cor: "bg-emerald-500", rotulo: "Novos", n: resultado.resumo.novos },
                    { cor: "bg-red-500", rotulo: "Removidos", n: resultado.resumo.removidos },
                    { cor: "bg-amber-500", rotulo: "Alterados", n: resultado.resumo.alterados },
                    { cor: "bg-zinc-300 dark:bg-zinc-600", rotulo: "Sem alteração", n: resultado.resumo.semAlteracao },
                  ].map((l) => (
                    <span key={l.rotulo} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.cor}`} />
                      {l.rotulo}:{" "}
                      <strong className="tabular-nums">{l.n.toLocaleString("pt-BR")}</strong>
                    </span>
                  ))}
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-sm font-semibold">O que mais mudou</p>
                  <p className="mb-3 text-xs text-zinc-500">
                    Campos com mais registros alterados
                  </p>
                  {resultado.estatisticas.camposMaisAlterados.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Nenhum dado alterado.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {resultado.estatisticas.camposMaisAlterados.map((c) => (
                        <Barra
                          key={c.rotulo}
                          rotulo={c.rotulo}
                          quantidade={c.quantidade}
                          maximo={resultado.estatisticas.camposMaisAlterados[0].quantidade}
                          cor="bg-amber-400"
                          href={hrefComparar({ relatorio: "1", campo: c.rotulo })}
                        />
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <p className="text-sm font-semibold">Novos por fabricante</p>
                  <p className="mb-3 text-xs text-zinc-500">
                    Fabricantes com mais registros novos
                  </p>
                  {resultado.estatisticas.novosPorFabricante.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nenhum registro novo.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {resultado.estatisticas.novosPorFabricante.map((f) => (
                        <Barra
                          key={f.fabricante}
                          rotulo={f.fabricante}
                          quantidade={f.quantidade}
                          maximo={resultado.estatisticas.novosPorFabricante[0].quantidade}
                          cor="bg-emerald-500"
                          href={hrefComparar({ relatorio: "1", fabricante: f.fabricante, tipo: "novos" })}
                        />
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <p className="text-sm font-semibold">Removidos por fabricante</p>
                  <p className="mb-3 text-xs text-zinc-500">
                    Fabricantes com mais registros removidos
                  </p>
                  {resultado.estatisticas.removidosPorFabricante.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Nenhum registro removido.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {resultado.estatisticas.removidosPorFabricante.map((f) => (
                        <Barra
                          key={f.fabricante}
                          rotulo={f.fabricante}
                          quantidade={f.quantidade}
                          maximo={resultado.estatisticas.removidosPorFabricante[0].quantidade}
                          cor="bg-red-500"
                          href={hrefComparar({ relatorio: "1", fabricante: f.fabricante, tipo: "removidos" })}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </section>

            <section id="novos" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros novos ({resultado.novos.length})
              </h2>
              {resultado.novos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro novo.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {resultado.novos.map((r) => (
                    <CardNovo key={r.marcas} r={r} />
                  ))}
                </div>
              )}
            </section>

            <section id="removidos" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros removidos ({resultado.removidos.length})
              </h2>
              {resultado.removidos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro removido.</p>
              ) : (
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {resultado.removidos.map((r) => (
                    <div
                      key={r.marcas}
                      className="flex flex-col gap-1 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold tracking-wider text-red-500">
                          {r.marcas}
                        </span>
                        {r.modelo ? (
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{r.modelo}</span>
                        ) : null}
                        {r.fabricante ? (
                          <span className="text-xs text-zinc-400">· {r.fabricante}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {r.tipoIcao ? <span>ICAO: {traduzirIcao(r.tipoIcao)}</span> : null}
                        {r.anoFabricacao ? <span>Ano: {r.anoFabricacao}</span> : null}
                        {r.proprietarios.length > 0 ? <span>Prop.: {r.proprietarios.join(", ")}</span> : null}
                        {r.operadores.length > 0 ? <span>Op.: {r.operadores.join(", ")}</span> : null}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            <section id="alterados" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros alterados ({resultado.alterados.length})
              </h2>
              {resultado.alterados.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nenhum registro alterado neste intervalo.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {resultado.alterados.map((d) => (
                    <Card key={d.marcas} className="overflow-hidden">
                      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/aeronaves/${d.marcas}`}
                            className="text-base text-sky-600 hover:underline dark:text-sky-400"
                          >
                            {formatarRegistro(d.marcas, d.modelo, d.tipoIcao, undefined, undefined, d.anoFabricacao, undefined, d.tipoIcaoNome)}
                          </Link>
                        </div>
                        <Badge>{d.campos.length} alteração(ões)</Badge>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {d.campos.map((c) => (
                          <div
                            key={c.campo}
                            className="flex flex-col gap-1 px-4 py-2.5"
                          >
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                              {c.campo}
                            </span>
                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
                              <span className="text-zinc-400 line-through decoration-red-400/60">
                                {decodificarValor(c.campo, c.antes)}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">
                                →
                              </span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {decodificarValor(c.campo, c.depois)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {resultado.paginas > 1 ? (
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: resultado.paginas }, (_, i) => i + 1).map(
                    (p) => (
                      <Link
                        key={p}
                        href={hrefComparar({ pagina: String(p) })}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                          p === resultado.pagina
                            ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25"
                            : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {p}
                      </Link>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>

      {/* Modal de relatório drill-down */}
      {abrirRelatorio && resultadoRelatorio && temFiltroDrillDown && base && alvo ? (
        <ModalRelatorio
          titulo={
            campoFiltro
              ? `Campo: ${campoFiltro}`
              : fabricanteFiltro
                ? `${fabricanteFiltro} — ${tipoLabelMap[tipoFiltro ?? ""] || "Alterados"}`
                : `Registros ${tipoLabelMap[tipoFiltro ?? ""]}`
          }
          subtitulo={`${formatarPeriodo(base)} → ${formatarPeriodo(alvo)}`}
          base={base}
          alvo={alvo}
          hrefVoltar={hrefComparar()}
        >
          {/* Relatório de campo específico */}
          {campoFiltro ? (
            <div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {resultadoRelatorio.alterados.length} registro(s) com alteração em <strong>{campoFiltro}</strong>
              </p>
              {resultadoRelatorio.alterados.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro encontrado.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Matrícula</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Valor Antes</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Valor Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoRelatorio.alterados.map((d) => {
                      const campo = d.campos.find((c) => c.campo === campoFiltro);
                      if (!campo) return null;
                      return (
                        <tr key={d.marcas} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="px-3 py-2">
                            <span className="text-sky-600 dark:text-sky-400">
                              {formatarRegistro(d.marcas, d.modelo, d.tipoIcao, undefined, undefined, d.anoFabricacao, undefined, d.tipoIcaoNome)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-red-500 line-through decoration-red-400/60">{decodificarValor(campoFiltro, campo.antes)}</td>
                          <td className="px-3 py-2 font-medium text-emerald-600 dark:text-emerald-400">{decodificarValor(campoFiltro, campo.depois)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : tipoFiltro === "novos" ? (
            <div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {resultadoRelatorio.novos.length} registro(s) novos{fabricanteFiltro ? ` de ${fabricanteFiltro}` : ""}
              </p>
              {resultadoRelatorio.novos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro encontrado.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Matrícula</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Modelo</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Fabricante</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ICAO</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Ano</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Proprietários</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Operadores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoRelatorio.novos.map((r) => (
                      <tr key={r.marcas} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.marcas}</td>
                        <td className="px-3 py-2 font-medium text-purple-600 dark:text-purple-400">{r.modelo ?? "—"}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{r.fabricante ?? "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{traduzirIcao(r.tipoIcao) || "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.anoFabricacao ? r.anoFabricacao : "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.proprietarios.length > 0 ? r.proprietarios.join(", ") : "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.operadores.length > 0 ? r.operadores.join(", ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tipoFiltro === "removidos" ? (
            <div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {resultadoRelatorio.removidos.length} registro(s) removidos{fabricanteFiltro ? ` de ${fabricanteFiltro}` : ""}
              </p>
              {resultadoRelatorio.removidos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro encontrado.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Matrícula</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Modelo / Fabricante</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ICAO</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Ano</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Proprietários</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Operadores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoRelatorio.removidos.map((r) => (
                      <tr key={r.marcas} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="px-3 py-2 font-mono font-bold text-red-500">{r.marcas}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-purple-600 dark:text-purple-400">{r.modelo ?? "—"}</span>
                          {r.fabricante ? <span className="ml-1 text-xs text-zinc-500">· {r.fabricante}</span> : null}
                        </td>
                        <td className="px-3 py-2 text-zinc-500">{traduzirIcao(r.tipoIcao) || "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.anoFabricacao ? r.anoFabricacao : "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.proprietarios.length > 0 ? r.proprietarios.join(", ") : "—"}</td>
                        <td className="px-3 py-2 text-zinc-500">{r.operadores.length > 0 ? r.operadores.join(", ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {resultadoRelatorio.alterados.length} registro(s) alterados{fabricanteFiltro ? ` de ${fabricanteFiltro}` : ""}
              </p>
              {resultadoRelatorio.alterados.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro encontrado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {resultadoRelatorio.alterados.map((d) => (
                    <div key={d.marcas} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-sm text-sky-600 dark:text-sky-400">
                          {formatarRegistro(d.marcas, d.modelo, d.tipoIcao, undefined, undefined, d.anoFabricacao)}
                        </span>
                        <Badge className="ml-2">{d.campos.length} alteração(ões)</Badge>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {d.campos.map((c) => (
                          <div key={c.campo} className="flex flex-col gap-1 px-4 py-2 text-sm sm:grid sm:grid-cols-3 sm:gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">{c.campo}</span>
                            <span className="truncate text-red-500 line-through decoration-red-400/60">{decodificarValor(c.campo, c.antes)}</span>
                            <span className="truncate font-medium text-emerald-600 dark:text-emerald-400">{decodificarValor(c.campo, c.depois)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalRelatorio>
      ) : null}
    </AppShell>
  );
}