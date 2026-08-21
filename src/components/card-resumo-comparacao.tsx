"use client";

import { PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CardResumo({
  tipo,
  icone,
  cor,
  rotulo,
  quantidade,
  href,
}: {
  tipo: "novos" | "removidos" | "alterados" | "sem";
  icone: "plus" | "minus" | "refresh" | "check";
  cor: string;
  rotulo: string;
  quantidade: number;
  href?: string;
}) {
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
  const iconMap = {
    plus: PlusCircle,
    minus: MinusCircle,
    refresh: RefreshCw,
    check: CheckCircle2,
  };
  const Icon = iconMap[icone];

  const borderHover =
    tipo === "novos"
      ? "hover:border-emerald-400"
      : tipo === "removidos"
        ? "hover:border-red-400"
        : tipo === "alterados"
          ? "hover:border-amber-400"
          : "";

  const content = (
    <div
      className={`group flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 ${borderHover} hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${href ? "cursor-pointer" : ""}`}
    >
      <Icon className={`h-5 w-5 ${cor}`} />
      <span className="text-2xl font-bold tabular-nums">
        {quantidade.toLocaleString("pt-BR")}
      </span>
      <span className="text-xs text-zinc-500">
        registros {rotulo}{" "}
        {href && !loading && <span className={cor}>→</span>}
      </span>
      {loading ? (
        <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-sky-600 dark:text-sky-400">
          <span className="h-3 w-3 animate-spin rounded-full border border-sky-200 border-t-sky-600 dark:border-sky-800 dark:border-t-sky-400" />
          {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")}.{(elapsed % 1000).toString().padStart(3, "0")}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={handleClick} className="block">
        {content}
      </a>
    );
  }

  return content;
}
