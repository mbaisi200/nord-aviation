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
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {bar}
      </a>
    );
  }

  return bar;
}
