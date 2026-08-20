import { AppShell } from "@/components/app-shell";
import { ImportadorRab } from "@/components/importador-rab";
import { listarPeriodos } from "@/app/actions/comparar";

export const metadata = {
  title: "Atualizar base RAB",
};

export default async function ImportarPage() {
  const periodos = await listarPeriodos();

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Atualizar base RAB
          </h1>
          <p className="text-sm text-zinc-500">
            Baixe o arquivo mensal do RAB no site da ANAC e importe aqui. O
            comparativo e as consultas passam a usar o mês mais recente
            automaticamente.
          </p>
        </div>
        <ImportadorRab periodos={periodos} />
      </div>
    </AppShell>
  );
}