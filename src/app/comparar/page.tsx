import Link from "next/link";
import {
  ArrowLeftRight,
  CheckCircle2,
  FileCode2,
  GitCompare,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { compararPeriodos, listarPeriodos } from "@/app/actions/comparar";
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

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{
    base?: string;
    alvo?: string;
    pagina?: string;
    imprimir?: string;
  }>;
}) {
  const params = await searchParams;
  const periodos = await listarPeriodos();

  const base = params.base && periodos.includes(params.base) ? params.base : undefined;
  const alvo = params.alvo && periodos.includes(params.alvo) ? params.alvo : undefined;
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);
  const imprimir = params.imprimir === "1";

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

        {!imprimir && periodos.length < 2 ? (
          <Card className="p-4 text-sm text-zinc-500">
            Ainda só existe um período importado. Quando o próximo arquivo
            mensal do RAB for importado (via <code>npm run import:rab</code>),
            você poderá comparar os meses aqui.
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
              <Card className="flex flex-col items-center gap-1 p-4 text-center">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold tabular-nums">
                  {resultado.resumo.novos.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-zinc-500">registros novos</span>
              </Card>
              <Card className="flex flex-col items-center gap-1 p-4 text-center">
                <MinusCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold tabular-nums">
                  {resultado.resumo.removidos.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-zinc-500">registros removidos</span>
              </Card>
              <Card className="flex flex-col items-center gap-1 p-4 text-center">
                <RefreshCw className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold tabular-nums">
                  {resultado.resumo.alterados.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-zinc-500">registros alterados</span>
              </Card>
              <Card className="flex flex-col items-center gap-1 p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-sky-500" />
                <span className="text-2xl font-bold tabular-nums">
                  {resultado.resumo.semAlteracao.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-zinc-500">sem alteração</span>
              </Card>
            </div>

            <section className="flex flex-col gap-2">
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

            <section className="flex flex-col gap-2">
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

            <section className="flex flex-col gap-2">
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