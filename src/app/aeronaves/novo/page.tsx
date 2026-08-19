import { AppShell } from "@/components/app-shell";
import { AeronaveForm } from "@/components/aeronave-form";
import { criarAeronave } from "@/app/actions/aeronaves";

export const metadata = {
  title: "Cadastrar aeronave",
  description: "Cadastre uma nova aeronave",
};

export default function NovaAeronavePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova aeronave</h1>
          <p className="text-sm text-zinc-500">
            Cadastre uma aeronave no Registro Aeronáutico Brasileiro
          </p>
        </div>
        <AeronaveForm action={criarAeronave} submitLabel="Cadastrar aeronave" />
      </div>
    </AppShell>
  );
}