"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import {
  criarPrimeiroUsuario,
  entrar,
  type EstadoAutenticacao,
} from "@/app/actions/autenticacao";

export function FormEntrar({
  temUsuarios,
  next,
}: {
  temUsuarios: boolean;
  next: string;
}) {
  const [state, formAction, pending] = useActionState<
    EstadoAutenticacao,
    FormData
  >(temUsuarios ? entrar : criarPrimeiroUsuario, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.erro ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.erro}
        </p>
      ) : null}
      {state?.sucesso ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {state.sucesso}
        </p>
      ) : null}

      {!temUsuarios ? (
        <Field label="Nome completo" htmlFor="nome">
          <Input
            id="nome"
            name="nome"
            required
            autoComplete="name"
            placeholder="Ex.: Marcio"
          />
        </Field>
      ) : null}

      <Field label="Usuário" htmlFor="login">
        <Input
          id="login"
          name="login"
          required
          autoComplete="username"
          placeholder="Seu usuário de acesso"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Senha" htmlFor="senha">
        <Input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={temUsuarios ? 1 : 8}
          autoComplete={
            temUsuarios ? "current-password" : "new-password"
          }
          placeholder="••••••••"
        />
      </Field>

      {!temUsuarios ? (
        <Field label="Confirmar senha" htmlFor="confirmar">
          <Input
            id="confirmar"
            name="confirmar"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Field>
      ) : null}

      <input type="hidden" name="next" value={next} />

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending
          ? "Aguarde..."
          : temUsuarios
            ? "Entrar"
            : "Criar primeiro usuário"}
      </Button>

      {temUsuarios ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <Lock className="h-3 w-3" />
          Seus dados ficam protegidos por senha.
        </p>
      ) : null}
    </form>
  );
}