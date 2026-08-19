import Link from "next/link";
import { Plane, Search, Plus, Database, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aeronaves } from "@/db/schema";

export default async function Home() {
  let total: number | null = null;
  try {
    const [r] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(aeronaves);
    total = r?.total ?? null;
  } catch {
    total = null;
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-sky-600/25">
          <div
            className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full border-[20px] border-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full border-[22px] border-white/10"
            aria-hidden
          />
          <Plane
            className="pointer-events-none absolute right-6 top-1/2 h-24 w-24 -translate-y-1/2 rotate-12 text-white/15"
            aria-hidden
          />

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Registro Aeronáutico Brasileiro
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
            Nord <span className="text-sky-200">Aviation</span>
          </h1>
          <p className="mt-1 max-w-sm text-sm text-white/80">
            Consulta e cadastro de aeronaves do RAB/ANAC com dados oficiais
            atualizados.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <Database className="h-5 w-5 text-sky-200" />
              <span className="mt-2 block text-2xl font-bold">
                {total != null ? total.toLocaleString("pt-BR") : "—"}
              </span>
              <span className="text-xs text-white/70">aeronaves na base</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <Plane className="h-5 w-5 text-sky-200" />
              <span className="mt-2 block text-2xl font-bold">Mensal</span>
              <span className="text-xs text-white/70">atualização do RAB</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Link href="/aeronaves/novo">
            <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/25">
                <Plus className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold">Cadastrar aeronave</p>
                <p className="text-sm text-zinc-500">
                  Adicione uma nova aeronave manualmente
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Card>
          </Link>
          <Link href="/aeronaves">
            <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 dark:from-sky-900 dark:to-indigo-900 dark:text-sky-300">
                <Search className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold">Consultar aeronaves</p>
                <p className="text-sm text-zinc-500">
                  Busque por prefixo, modelo, fabricante ou série
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Card>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}