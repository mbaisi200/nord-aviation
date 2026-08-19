import { exigirSessao } from "@/lib/auth";
import { FormTrocarSenha } from "@/components/form-trocar-senha";

export default async function TrocarSenhaPage() {
  const sessao = await exigirSessao();

  return (
    <div className="mx-auto w-full max-w-sm py-6">
      <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Trocar senha
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Conectado como <strong>{sessao.nome}</strong> ({sessao.login}).
      </p>
      <div className="mt-6 rounded-3xl border border-zinc-200/80 bg-white/85 p-6 shadow-xl shadow-sky-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
        <FormTrocarSenha />
      </div>
    </div>
  );
}