"use client";

import { PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from "lucide-react";

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
        {href && <span className={cor}>→</span>}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
