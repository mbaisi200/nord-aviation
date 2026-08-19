"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { excluirAeronave } from "@/app/actions/aeronaves";

export function BotaoExcluir({ marcas }: { marcas: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(() => {
          if (confirm(`Excluir a aeronave ${marcas}? Essa ação não pode ser desfeita.`)) {
            void excluirAeronave(formData);
          }
        })
      }
    >
      <input type="hidden" name="marcas" value={marcas} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Excluir aeronave"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}