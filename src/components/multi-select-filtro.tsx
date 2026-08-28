"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface MultiSelectOption {
  v: string;
  r: string;
}

export function MultiSelectFiltro({
  nome,
  rotulo,
  opcoes,
  selecionados = [],
}: {
  nome: string;
  rotulo: string;
  opcoes: MultiSelectOption[] | string[];
  selecionados?: string[];
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionadosState, setSelecionadosState] =
    useState<string[]>(selecionados);
  const prevKey = useRef("");

  // Sincroniza quando os props mudam (ex: navegação com filtros na URL)
  useEffect(() => {
    const key = JSON.stringify(selecionados ?? []);
    if (key !== prevKey.current) {
      prevKey.current = key;
      setSelecionadosState(selecionados ?? []);
    }
  }, [selecionados]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizadas = opcoes.map((o) =>
    typeof o === "string" ? { v: o, r: o } : o,
  );

  const filtradas = busca.trim()
    ? normalizadas.filter((o) =>
        o.r.toLowerCase().includes(busca.toLowerCase()),
      )
    : normalizadas;

  const toggle = useCallback(
    (valor: string) => {
      setSelecionadosState((prev) =>
        prev.includes(valor)
          ? prev.filter((v) => v !== valor)
          : [...prev, valor],
      );
    },
    [],
  );

  const remover = useCallback((valor: string) => {
    setSelecionadosState((prev) => prev.filter((v) => v !== valor));
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [aberto]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {rotulo}
      </label>
      <div ref={containerRef} className="relative">
        {/* Campos hidden para submeter os valores */}
        {selecionadosState.map((v) => (
          <input key={v} type="hidden" name={nome} value={v} />
        ))}

        {/* Input principal */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setAberto((a) => !a);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setAberto((a) => !a);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          className={`flex h-11 w-full cursor-pointer items-center gap-1.5 overflow-hidden rounded-xl border bg-white px-3.5 text-left text-[15px] transition-colors dark:bg-zinc-900 ${
            aberto
              ? "border-sky-500 ring-2 ring-sky-500/20"
              : "border-zinc-300 dark:border-zinc-700"
          } ${selecionadosState.length === 0 ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selecionadosState.length === 0 ? (
              <span className="truncate">Todos</span>
            ) : (
              selecionadosState.map((v) => {
                const opt = normalizadas.find((o) => o.v === v);
                return (
                  <span
                    key={v}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                  >
                    {opt?.r ?? v}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remover(v);
                      }}
                      className="rounded-full p-0.5 hover:bg-sky-200 dark:hover:bg-sky-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${aberto ? "rotate-180" : ""}`}
          />
        </div>

        {/* Dropdown */}
        {aberto && (
          <div className="absolute z-50 mt-1 max-h-80 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {/* Campo de busca dentro do dropdown */}
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
              <input
                ref={inputRef}
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Lista de opções com checkbox */}
            <div className="overflow-y-auto max-h-64 p-1">
              {filtradas.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-500">
                  Nenhum resultado
                </p>
              ) : (
                filtradas.map((o) => {
                  const marcado = selecionadosState.includes(o.v);
                  return (
                    <label
                      key={o.v}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        marcado
                          ? "bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggle(o.v)}
                        className="h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 focus:ring-sky-500/20 dark:border-zinc-600"
                      />
                      <span className="truncate">{o.r}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
