import { Plane, Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, Input } from "@/components/ui";
import { FiltrosAeronaves } from "@/components/filtros-aeronaves";
import { buscarAeronaves, type FiltrosAeronaves as Filtros } from "@/app/actions/aeronaves";
import { situacaoCor, situacaoLabel } from "@/lib/aeronave";
import { formatarData } from "@/lib/format";

export const metadata = {
  title: "Consultar aeronaves",
  description: "Consulte aeronaves registradas no RAB (ANAC)",
};

export const dynamic = "force-dynamic";

const CAMPOS_FILTRO = [
  "situacao",
  "fabricante",
  "modelo",
  "tpMotor",
  "qtMotor",
  "tpPouso",
  "tpCa",
  "cfOperacional",
  "categoria",
  "tpOperacao",
  "anoDe",
  "anoAte",
  "proprietario",
  "operador",
] as const;

function extrairFiltros(
  params: Record<string, string | string[] | undefined>,
): Filtros {
  const filtros: Filtros = {};
  for (const campo of CAMPOS_FILTRO) {
    const valor = params[campo];
    if (typeof valor === "string" && valor.trim() !== "") {
      filtros[campo] = valor.trim();
    }
  }
  return filtros;
}

export default async function ListaAeronavesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string } & Record<string, string>>;
}) {
  const params = await searchParams;
  const termo = params.q ?? "";
  const pagina = Math.max(1, Number(params.pagina) || 1);
  const filtros = extrairFiltros(params);
  const temFiltros = CAMPOS_FILTRO.some((c) => filtros[c]);
  const { registros, total, paginas } = await buscarAeronaves(
    termo,
    pagina,
    filtros,
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Consultar aeronaves</h1>
          <p className="text-sm text-zinc-500">
            {total.toLocaleString("pt-BR")} aeronave{total === 1 ? "" : "s"} no RAB
          </p>
        </div>

        <form action="/aeronaves" className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            name="q"
            defaultValue={termo}
            placeholder="Buscar por prefixo, modelo, fabricante..."
            className="h-12 pl-11 pr-16"
          />
          {termo || temFiltros ? (
            <Link
              href="/aeronaves"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950"
            >
              Limpar
            </Link>
          ) : null}
        </form>

        <details className="group overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/70 shadow-sm transition-shadow group-open:shadow-md group-open:ring-2 group-open:ring-sky-500/25 dark:border-sky-800/50 dark:from-sky-950/40 dark:via-zinc-900 dark:to-indigo-950/40" open={temFiltros}>
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sky-50/60 dark:text-zinc-300 dark:hover:bg-sky-950/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/30">
              <SlidersHorizontal
                className={`h-4 w-4 ${temFiltros ? "" : "opacity-90"}`}
              />
            </span>
            <span className={temFiltros ? "text-sky-800 dark:text-sky-300" : ""}>
              Filtros
            </span>
            {temFiltros ? (
              <span className="ml-auto rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-sky-600/30">
                {CAMPOS_FILTRO.filter((c) => filtros[c]).length} ativo
                {CAMPOS_FILTRO.filter((c) => filtros[c]).length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="ml-auto text-xs font-normal text-zinc-400 dark:text-zinc-500">
                Refine a busca
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <FiltrosAeronaves valores={filtros} ativos={temFiltros} />
          </div>
        </details>

        {registros.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Plane className="h-10 w-10 text-zinc-300" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Nenhuma aeronave encontrada
            </p>
            <p className="text-sm text-zinc-500">
              Tente outro termo ou cadastre uma nova aeronave.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {registros.map((a) => (
              <Link key={a.marcas} href={`/aeronaves/${a.marcas}`}>
                <Card className="flex flex-col gap-2 p-4 transition-colors hover:border-sky-400">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                        {a.marcas}
                      </span>
                      <Badge className={situacaoCor(a.cdInterdicao)}>
                        {situacaoLabel(a.cdInterdicao)}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatarData(a.dtMatricula)}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">{a.dsModelo ?? "Modelo não informado"}</span>
                    {a.nmFabricante ? (
                      <span> · {a.nmFabricante}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                    {a.nrAnoFabricacao ? <span>{a.nrAnoFabricacao}</span> : null}
                    {a.nrSerie ? <span>SN {a.nrSerie}</span> : null}
                    {a.tpOperacao ? (
                      <span className="uppercase">{a.tpOperacao}</span>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {paginas > 1 ? (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={{
                pathname: "/aeronaves",
                query: {
                  ...params,
                  ...(termo ? { q: termo } : { q: undefined }),
                  pagina: Math.max(1, pagina - 1),
                },
              }}
              aria-disabled={pagina <= 1}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
            <span className="text-sm text-zinc-500">
              Página {pagina} de {paginas}
            </span>
            <Link
              href={{
                pathname: "/aeronaves",
                query: {
                  ...params,
                  ...(termo ? { q: termo } : { q: undefined }),
                  pagina: Math.min(paginas, pagina + 1),
                },
              }}
              aria-disabled={pagina >= paginas}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}