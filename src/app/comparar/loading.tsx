export default function LoadingComparar() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-600 dark:border-zinc-700 dark:border-t-sky-400" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Consultando, aguarde..</p>
      <p className="text-xs text-zinc-400">Buscando no Banco de Dados</p>
    </div>
  );
}
