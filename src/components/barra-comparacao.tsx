"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Barra({
  rotulo,
  quantidade,
  maximo,
  cor,
  href,
}: {
  rotulo: string;
  quantidade: number;
  maximo: number;
  cor: string;
  href?: string;
}) {
  const pct = maximo > 0 ? Math.round((quantidade / maximo) * 100) : 0;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    setLoading(true);
    const id = setInterval(() => setElapsed((v) => v + 30), 30);
    router.push(href);
    setTimeout(() => clearInterval(id), 10000);
  };

  const bar = (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <span
        className="w-24 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-400"
        title={rotulo}
      >
        {rotulo}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${cor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
        {quantidade}
      </span>
      {loading ? (
        <span className="ml-1 flex items-center gap-1 text-[10px] font-mono tabular-nums text-sky-600 dark:text-sky-400">
          <span className="h-3 w-3 animate-spin rounded-full border border-sky-200 border-t-sky-600 dark:border-sky-800 dark:border-t-sky-400" />
          {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")}.{(elapsed % 1000).toString().padStart(3, "0")}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className="block rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {bar}
      </a>
    );
  }

  return bar;
}
