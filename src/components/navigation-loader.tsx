"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function NavigationLoader() {
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Intercepta cliques em links e submits para mostrar loader imediatamente, inclusive no primeiro Comparar
    const clickHandler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href*='/comparar']");
      if (a) {
        const href = a.getAttribute("href");
        if (href && href.includes("base=") && href.includes("alvo=")) {
          setShow(true);
          setElapsed(0);
          const id = setInterval(() => setElapsed((v) => v + 30), 30);
          setTimeout(() => clearInterval(id), 10000);
          setTimeout(() => setShow(false), 5000);
        }
      }
    };
    const submitHandler = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form && form.action && form.action.includes("/comparar")) {
        setShow(true);
        setElapsed(0);
        const id = setInterval(() => setElapsed((v) => v + 30), 30);
        setTimeout(() => clearInterval(id), 10000);
      }
    };
    document.addEventListener("click", clickHandler);
    document.addEventListener("submit", submitHandler);
    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("submit", submitHandler);
    };
  }, []);

  // Também mostra durante transições do router
  useEffect(() => {
    if (isPending) {
      setShow(true);
      setElapsed(0);
      const id = setInterval(() => setElapsed((v) => v + 30), 30);
      return () => clearInterval(id);
    } else {
      // mantém visível um pouco para não piscar
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [isPending]);

  if (!show && !isPending) return null;

  const mm = String(Math.floor(elapsed / 60000)).padStart(2, "0");
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
  const mmm = String(elapsed % 1000).padStart(3, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-8 py-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-600 dark:border-zinc-700 dark:border-t-sky-400" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Consultando, aguarde..</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Buscando no Banco de Dados</p>
        <p className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {mm}:{ss}.{mmm}
        </p>
      </div>
    </div>
  );
}
