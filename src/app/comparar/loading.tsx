"use client";

import { useEffect, useState } from "react";

export default function LoadingComparar() {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMs((m) => m + 30), 30);
    return () => clearInterval(id);
  }, []);

  const totalSegundos = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
  const ss = String(totalSegundos % 60).padStart(2, "0");
  const mmm = String(ms % 1000).padStart(3, "0");

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-600 dark:border-zinc-700 dark:border-t-sky-400" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Consultando, aguarde..</p>
      <p className="text-xs text-zinc-400">Buscando no Banco de Dados</p>
      <p className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        <span className="h-3 w-3 rounded-full border border-zinc-300 border-t-zinc-500 dark:border-zinc-600 dark:border-t-zinc-300 animate-spin" aria-hidden />
        {mm}:{ss}.{mmm}
      </p>
    </div>
  );
}
