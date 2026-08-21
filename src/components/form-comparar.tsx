"use client";

import { Button } from "@/components/ui";
import { GitCompare } from "lucide-react";

export function FormComparar({ periodos, base, alvo }: { periodos: string[]; base?: string; alvo?: string }) {
  const format = (p: string) => {
    const [ano, mes] = p.split("-");
    const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    return `${meses[Number(mes)-1]} de ${ano}`;
  };

  return (
    <form method="GET" action="/comparar" className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Período base (antes)
          <select
            name="base"
            defaultValue={base ?? periodos[1] ?? periodos[0]}
            className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {periodos.map((p) => (
              <option key={p} value={p}>{format(p)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Período comparativo (depois)
          <select
            name="alvo"
            defaultValue={alvo ?? periodos[0]}
            className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {periodos.map((p) => (
              <option key={p} value={p}>{format(p)}</option>
            ))}
          </select>
        </label>
      </div>
      <Button type="submit">
        <GitCompare className="h-4 w-4" />
        Comparar
      </Button>
    </form>
  );
}
