/**
 * Normaliza strings para búsqueda sin distinción de acentos ni mayúsculas.
 * Replica searchNormalize.ts del frontend web.
 */

export function normalizeSearch(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica si `text` contiene `query` ignorando acentos y mayúsculas
 */
export function matchSearch(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  if (!query.trim()) return true;
  return normalizeSearch(text).includes(normalizeSearch(query));
}

/**
 * Filtra un array de strings o extrae un campo, comparando con la query
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => (string | null | undefined)[]
): T[] {
  if (!query.trim()) return items;
  const q = normalizeSearch(query);
  return items.filter((item) =>
    getFields(item).some((field) => field && normalizeSearch(field).includes(q))
  );
}
