import Link from "next/link";
import { GitCompare, Plane, Plus, Search } from "lucide-react";
import { obterSessao } from "@/lib/auth";
import { MenuUsuario } from "@/components/menu-usuario";
import { ThemeToggle } from "@/components/theme-toggle";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessao();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pb-20 sm:max-w-3xl sm:pb-8">
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/75 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/75">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-600/30">
              <Plane className="h-4.5 w-4.5" />
            </span>
            <span className="font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">
              Nord Aviation
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/comparar"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:inline-flex dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <GitCompare className="h-4 w-4" />
              Comparar
            </Link>
            <Link
              href="/aeronaves/novo"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-3.5 text-sm font-medium text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-sky-600/30"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova aeronave</span>
            </Link>
            <div className="flex items-center gap-1">
            <ThemeToggle />
            {sessao ? <MenuUsuario nome={sessao.nome} /> : null}
          </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200/80 bg-background/90 backdrop-blur-md dark:border-zinc-800 sm:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          <Link
            href="/"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900"
          >
            <Plane className="h-5 w-5" />
            Início
          </Link>
          <Link
            href="/aeronaves"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900"
          >
            <Search className="h-5 w-5" />
            Consultar
          </Link>
          <Link
            href="/aeronaves/novo"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-600/30">
              <Plus className="h-5 w-5" />
            </span>
            Cadastrar
          </Link>
          <Link
            href="/comparar"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900"
          >
            <GitCompare className="h-5 w-5" />
            Comparar
          </Link>
        </div>
      </nav>
    </div>
  );
}