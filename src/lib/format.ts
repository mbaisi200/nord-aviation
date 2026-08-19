export function formatarData(d: Date | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function formatarDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarNumero(n: number | string | null | undefined): string {
  if (n == null || n === "") return "";
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isNaN(num) ? String(n) : num.toLocaleString("pt-BR");
}