import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Users, Building2, Plane } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";

import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui";
import { situacaoLabel } from "@/lib/aeronave";
import { formatarData, formatarNumero } from "@/lib/format";
import { BotaoExcluir } from "@/components/botao-excluir";

export const metadata = {
  title: "Detalhes da aeronave",
};

export default async function DetalheAeronavePage({
  params,
}: {
  params: Promise<{ marcas: string }>;
}) {
  const { marcas } = await params;
  const aeronave = await db.query.aeronaves.findFirst({
    where: (a, { eq }) => eq(a.marcas, marcas.toUpperCase()),
    with: {
      proprietarios: { with: { proprietario: true } },
      operadores: { with: { operador: true } },
    },
  });

  if (!aeronave) notFound();

  const campos: { rotulo: string; valor: React.ReactNode }[] = [
    { rotulo: "Nº certificado de matrícula", valor: aeronave.nrCertMatricula },
    { rotulo: "Nº de série", valor: aeronave.nrSerie },
    { rotulo: "Código de tipo", valor: aeronave.cdTipo },
    { rotulo: "Classe", valor: aeronave.cdCls },
    { rotulo: "Tipo ICAO", valor: aeronave.cdTipoIcao },
    { rotulo: "PMD (kg)", valor: formatarNumero(aeronave.nrPmd) },
    { rotulo: "Tripulação mínima", valor: aeronave.nrTripulacaoMin },
    { rotulo: "Passageiros máx.", valor: aeronave.nrPassageirosMax },
    { rotulo: "Assentos", valor: aeronave.nrAssentos },
    { rotulo: "Ano de fabricação", valor: aeronave.nrAnoFabricacao },
    { rotulo: "Validade CVA", valor: aeronave.dtValidadeCva },
    { rotulo: "Validade CA", valor: formatarData(aeronave.dtValidadeCa) },
    { rotulo: "Data de matrícula", valor: formatarData(aeronave.dtMatricula) },
    { rotulo: "Cancelamento", valor: formatarData(aeronave.dtCanc) },
    { rotulo: "Motivo de cancelamento", valor: aeronave.dsMotivoCanc },
    { rotulo: "Gravame", valor: aeronave.dsGravame },
    { rotulo: "Tipo de motor", valor: aeronave.tpMotor },
    { rotulo: "Quantidade de motores", valor: aeronave.qtMotor },
    { rotulo: "Tipo de pouso", valor: aeronave.tpPouso },
    { rotulo: "Tipo de CA", valor: aeronave.tpCa },
    { rotulo: "Propósito CAVE", valor: aeronave.cdPropositoCave },
    { rotulo: "CF operacional", valor: aeronave.cfOperacional },
    { rotulo: "Categoria de homologação", valor: aeronave.dsCategoriaHomologacao },
    { rotulo: "Tipo de operação", valor: aeronave.tpOperacao },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/aeronaves"
            className="inline-flex h-9 items-center gap-1 rounded-full text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/aeronaves/${aeronave.marcas}/editar`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="Editar aeronave"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <BotaoExcluir marcas={aeronave.marcas} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-sky-600/25">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border-[18px] border-white/10"
            aria-hidden
          />
          <Plane
            className="pointer-events-none absolute right-6 top-1/2 h-20 w-20 -translate-y-1/2 rotate-12 text-white/15"
            aria-hidden
          />
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-bold italic tracking-wide">
              {aeronave.marcas}
            </h1>
            <Badge className="border-white/30 bg-white/15 text-white">
              {situacaoLabel(aeronave.cdInterdicao)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-white/80">
            {aeronave.dsModelo ?? "Modelo não informado"}
            {aeronave.nmFabricante ? ` · ${aeronave.nmFabricante}` : ""}
          </p>
        </div>

        <Card className="divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800">
          {campos.map((campo, i) => (
            <div
              key={campo.rotulo}
              className={`flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-sky-50/50 dark:hover:bg-sky-950/20 ${i % 2 === 0 ? "bg-zinc-50/50 dark:bg-zinc-900/50" : ""}`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {campo.rotulo}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {campo.valor || "—"}
              </span>
            </div>
          ))}
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-sky-600" />
              Proprietários
              <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {aeronave.proprietarios.length}
              </span>
            </div>
            {aeronave.proprietarios.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum proprietário registrado.</p>
            ) : (
              aeronave.proprietarios.map(({ proprietario, percentual }) => (
                <div
                  key={proprietario.id}
                  className="flex items-start justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium">{proprietario.nome}</p>
                    <p className="text-xs text-zinc-500">
                      {proprietario.documento}
                      {proprietario.uf ? ` · ${proprietario.uf}` : ""}
                    </p>
                  </div>
                  {percentual ? (
                    <span className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {Number(percentual).toLocaleString("pt-BR")}%
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-sky-600" />
              Operadores
              <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {aeronave.operadores.length}
              </span>
            </div>
            {aeronave.operadores.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum operador registrado.</p>
            ) : (
              aeronave.operadores.map(({ operador }) => (
                <div
                  key={operador.id}
                  className="flex items-start justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium">{operador.nome}</p>
                    <p className="text-xs text-zinc-500">
                      {operador.documento}
                      {operador.uf ? ` · ${operador.uf}` : ""}
                    </p>
                  </div>
                  {operador.operacao135 ? (
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      135
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}