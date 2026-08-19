"use client";

import { useActionState } from "react";
import { LogOut, KeyRound } from "lucide-react";
import Link from "next/link";
import { sair } from "@/app/actions/autenticacao";

export function MenuUsuario({ nome }: { nome: string }) {
  const [, formAction, pending] = useActionState(sair, null);

  return (
    <div className="flex items-center gap-1">
      <span className="hidden max-w-28 truncate text-sm text-zinc-500 sm:inline dark:text-zinc-400">
        {nome}
      </span>
      <Link
        href="/trocar-senha"
        title="Trocar senha"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <KeyRound className="h-4 w-4" />
      </Link>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          title="Sair"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}