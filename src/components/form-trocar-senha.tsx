"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import {
  trocarSenha,
  type EstadoAutenticacao,
} from "@/app/actions/autenticacao";

export function FormTrocarSenha() {
  const [state, formAction, pending] = useActionState<
    EstadoAutenticacao,
    FormData
  >(trocarSenha, null);

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

      <Field label="Senha atual" htmlFor="senhaAtual">
        <Input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      <Field label="Nova senha" htmlFor="novaSenha" hint="Mínimo de 8 caracteres.">
        <Input
          id="novaSenha"
          name="novaSenha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Field>

      <Field label="Confirmar nova senha" htmlFor="confirmar">
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

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}