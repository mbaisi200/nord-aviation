import Link from "next/link";
import { Plane } from "lucide-react";
import { contarUsuarios } from "@/lib/auth";
import { FormEntrar } from "@/components/form-entrar";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const temUsuarios = (await contarUsuarios()) > 0;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-600/30">
            <Plane className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-sky-400 dark:to-indigo-400">
              Nord Aviation
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Acesso restrito ao sistema
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-6 shadow-xl shadow-sky-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
          <FormEntrar temUsuarios={temUsuarios} next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          {temUsuarios ? (
            <>
              Esqueceu a senha?{" "}
              <Link href="/trocar-senha" className="text-sky-600 underline">
                Trocar senha
              </Link>
            </>
          ) : (
            "Seja o primeiro usuário: crie o acesso inicial acima."
          )}
        </p>
      </div>
    </div>
  );
}