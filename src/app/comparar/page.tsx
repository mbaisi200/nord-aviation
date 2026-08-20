import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  GitCompare,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import {
  compararMatricula,
  compararPeriodos,
  listarPeriodos,
} from "@/app/actions/comparar";
import { AutoImprimir } from "@/components/auto-imprimir";

export const metadata = {
  title: "Comparar períodos do RAB",
};

function formatarPeriodo(p: string): string {
  const [ano, mes] = p.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${meses[Number(mes) - 1]} de ${ano}`;
}

function Barra({
  rotulo,
  quantidade,
  maximo,
  cor,
}: {
  rotulo: string;
  quantidade: number;
  maximo: number;
  cor: string;
}) {
  const pct = maximo > 0 ? Math.round((quantidade / maximo) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-24 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-400"
        title={rotulo}
      >
        {rotulo}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${cor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
        {quantidade}
      </span>
    </div>
  );
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
  }>;
}) {
  const params = await searchParams;
  const periodos = await listarPeriodos();

  const base = params.base && periodos.includes(params.base) ? params.base : undefined;
  const alvo = params.alvo && periodos.includes(params.alvo) ? params.alvo : undefined;
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);
  const imprimir = params.imprimir === "1";

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

  const temComparacao = base && alvo;
  const resultado =
    base && alvo
      ? await compararPeriodos(base, alvo, imprimir ? 1 : pagina, imprimir ? 1000000 : 50)
      : null;

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

        {!imprimir ? (
          <Card className="p-4">
            <form method="GET" action="/comparar" className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Período base (antes)
                  <select
                    name="base"
                    defaultValue={base ?? periodos[1] ?? periodos[0]}
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
                  Período comparativo (depois)
                  <select
                    name="alvo"
                    defaultValue={alvo ?? periodos[0]}
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
                <GitCompare className="h-4 w-4" />
                Comparar
              </Button>
            </form>
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
              </div>
              {!imprimir ? (
                <div className="flex gap-2 print:hidden">
                  <LinkButton
                    href={`/comparar?base=${resultado.base}&alvo=${resultado.alvo}&imprimir=1`}
                    variant="secondary"
                  >
                    <Printer className="h-4 w-4" />
                    Exportar PDF
                  </LinkButton>
                  <LinkButton
                    href={`/api/exportar?base=${resultado.base}&alvo=${resultado.alvo}&formato=xml`}
                    variant="secondary"
                  >
                    <FileCode2 className="h-4 w-4" />
                    Exportar XML
                  </LinkButton>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <a href="#novos" className="group">
                <Card className="flex flex-col items-center gap-1 p-4 text-center transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-400 group-hover:shadow-lg">
                  <PlusCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold tabular-nums">
                    {resultado.resumo.novos.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    registros novos{" "}
                    <span className="text-emerald-500">↓</span>
                  </span>
                </Card>
              </a>
              <a href="#removidos" className="group">
                <Card className="flex flex-col items-center gap-1 p-4 text-center transition-all group-hover:-translate-y-0.5 group-hover:border-red-400 group-hover:shadow-lg">
                  <MinusCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold tabular-nums">
                    {resultado.resumo.removidos.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    registros removidos{" "}
                    <span className="text-red-500">↓</span>
                  </span>
                </Card>
              </a>
              <a href="#alterados" className="group">
                <Card className="flex flex-col items-center gap-1 p-4 text-center transition-all group-hover:-translate-y-0.5 group-hover:border-amber-400 group-hover:shadow-lg">
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold tabular-nums">
                    {resultado.resumo.alterados.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    registros alterados{" "}
                    <span className="text-amber-500">↓</span>
                  </span>
                </Card>
              </a>
              <Card className="flex flex-col items-center gap-1 p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-sky-500" />
                <span className="text-2xl font-bold tabular-nums">
                  {resultado.resumo.semAlteracao.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-zinc-500">sem alteração</span>
              </Card>
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
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </section>

            <section id="novos" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros novos ({resultado.resumo.novos})
              </h2>
              {resultado.novos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro novo.</p>
              ) : (
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {resultado.novos.map((m) => (
                    <Link
                      key={m}
                      href={`/aeronaves/${m}`}
                      className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
                    >
                      <span className="font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                        {m}
                      </span>
                      <span className="text-xs text-zinc-400">ver detalhes →</span>
                    </Link>
                  ))}
                </Card>
              )}
            </section>

            <section id="removidos" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros removidos ({resultado.resumo.removidos})
              </h2>
              {resultado.removidos.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum registro removido.</p>
              ) : (
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {resultado.removidos.map((m) => (
                    <div
                      key={m}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="font-mono font-bold tracking-wider text-red-500 line-through">
                        {m}
                      </span>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            <section id="alterados" className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Registros alterados ({resultado.resumo.alterados})
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
                        <Link
                          href={`/aeronaves/${d.marcas}`}
                          className="font-mono text-base font-bold tracking-wider text-sky-600 hover:underline dark:text-sky-400"
                        >
                          {d.marcas}
                        </Link>
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
                                {c.antes}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">
                                →
                              </span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {c.depois}
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
                        href={`/comparar?base=${resultado.base}&alvo=${resultado.alvo}&pagina=${p}`}
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
    </AppShell>
  );
}