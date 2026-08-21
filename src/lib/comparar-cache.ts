export const compararCache = new Map<string, { data: any; ts: number }>();
export const COMPARAR_TTL = 5 * 60 * 1000;
export function limparCacheComparar() {
  compararCache.clear();
}
