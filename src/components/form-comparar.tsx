"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { GitCompare } from "lucide-react";

export function FormComparar({ periodos, base, alvo }: { periodos: string[]; base?: string; alvo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const b = String(fd.get("base") ?? "");
    const a = String(fd.get("alvo") ?? "");
    setLoading(true);
    router.push(`/comparar?base=${encodeURIComponent(b)}&alvo=${encodeURIComponent(a)}`);
  };

  const format = (p: string) => {
    const [ano, mes] = p.split("-");
    const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    return `${meses[Number(mes)-1]} de ${ano}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-600 dark:border-zinc-700 dark:border-t-sky-400" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Consultando, aguarde..</p>
        <p className="text-xs text-zinc-400">Buscando no Banco de Dados</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
