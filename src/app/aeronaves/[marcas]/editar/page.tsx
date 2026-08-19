import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";

import { AppShell } from "@/components/app-shell";
import { AeronaveForm } from "@/components/aeronave-form";
import { atualizarAeronave } from "@/app/actions/aeronaves";
import { formatarData } from "@/lib/format";
import type { AeronaveForm as FormType } from "@/lib/aeronave";

export const metadata = {
  title: "Editar aeronave",
};

export default async function EditarAeronavePage({
  params,
}: {
  params: Promise<{ marcas: string }>;
}) {
  const { marcas } = await params;
  const aeronave = await db.query.aeronaves.findFirst({
    where: (a, { eq }) => eq(a.marcas, marcas.toUpperCase()),
  });

  if (!aeronave) notFound();

  const valores: FormType = {
    marcas: aeronave.marcas,
    nrCertMatricula: aeronave.nrCertMatricula?.toString() ?? "",
    nrSerie: aeronave.nrSerie ?? "",
    cdTipo: aeronave.cdTipo ?? "",
    dsModelo: aeronave.dsModelo ?? "",
    nmFabricante: aeronave.nmFabricante ?? "",
    cdCls: aeronave.cdCls ?? "",
    nrPmd: aeronave.nrPmd ?? "",
    cdTipoIcao: aeronave.cdTipoIcao ?? "",
    nrTripulacaoMin: aeronave.nrTripulacaoMin?.toString() ?? "",
    nrPassageirosMax: aeronave.nrPassageirosMax?.toString() ?? "",
    nrAssentos: aeronave.nrAssentos?.toString() ?? "",
    nrAnoFabricacao: aeronave.nrAnoFabricacao?.toString() ?? "",
    dtValidadeCva: aeronave.dtValidadeCva ?? "",
    dtValidadeCa: formatarData(aeronave.dtValidadeCa),
    dtCanc: formatarData(aeronave.dtCanc),
    dsMotivoCanc: aeronave.dsMotivoCanc ?? "",
    cdInterdicao: aeronave.cdInterdicao ?? "",
    dsGravame: aeronave.dsGravame ?? "",
    dtMatricula: formatarData(aeronave.dtMatricula),
    tpMotor: aeronave.tpMotor ?? "",
    qtMotor: aeronave.qtMotor?.toString() ?? "",
    tpPouso: aeronave.tpPouso ?? "",
    tpCa: aeronave.tpCa ?? "",
    cdPropositoCave: aeronave.cdPropositoCave ?? "",
    cfOperacional: aeronave.cfOperacional ?? "",
    dsCategoriaHomologacao: aeronave.dsCategoriaHomologacao ?? "",
    tpOperacao: aeronave.tpOperacao ?? "",
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/aeronaves/${aeronave.marcas}`}
            className="inline-flex h-9 items-center gap-1 rounded-full text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar <span className="font-mono">{aeronave.marcas}</span>
          </h1>
          <p className="text-sm text-zinc-500">Altere os dados da aeronave</p>
        </div>
        <AeronaveForm
          action={atualizarAeronave}
          submitLabel="Salvar alterações"
          values={valores}
        />
      </div>
    </AppShell>
  );
}