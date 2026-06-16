/**
 * Colores para los bloques de plan de entrenamiento.
 * Replica planBlockColors.ts del frontend web.
 */

const FALLBACK_BLOCK_COLOR = '#94a3b8';

const BLOCK_COLORS = [
  { bg: '#dc2626', text: '#FFFFFF', light: '#fee2e2' },
  { bg: '#2563eb', text: '#FFFFFF', light: '#dbeafe' },
  { bg: '#16a34a', text: '#FFFFFF', light: '#dcfce7' },
  { bg: '#d97706', text: '#FFFFFF', light: '#fef3c7' },
  { bg: '#7c3aed', text: '#FFFFFF', light: '#ede9fe' },
  { bg: '#0891b2', text: '#FFFFFF', light: '#cffafe' },
  { bg: '#db2777', text: '#FFFFFF', light: '#fce7f3' },
  { bg: '#65a30d', text: '#FFFFFF', light: '#ecfccb' },
  { bg: '#1d4ed8', text: '#FFFFFF', light: '#dbeafe' },
  { bg: '#b45309', text: '#FFFFFF', light: '#fef3c7' },
];

export interface BlockColor {
  bg: string;
  text: string;
  light: string;
}

function parseColor(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^(rgb|hsl)/i.test(s)) return s;
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  return s;
}

function colorFromBloqueItem(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nested = o.bloque as Record<string, unknown> | undefined;
  return parseColor(nested?.color ?? o.color);
}

/** Color explícito del bloque o gris de respaldo. */
export function resolveBlockColor(bloque: { color?: string | null } | null | undefined): string {
  return colorFromBloqueItem(bloque) ?? FALLBACK_BLOCK_COLOR;
}

/**
 * Colores en el mismo orden que los bloques del plan (para franja lateral / gradiente).
 */
export function blockColorsFromPlan(bloques: unknown[]): string[] {
  const out: string[] = [];
  for (const b of bloques) {
    const p = colorFromBloqueItem(b);
    if (p) out.push(p);
  }
  return out.length > 0 ? out : [FALLBACK_BLOCK_COLOR];
}

export function getPlanBlockColor(index: number): BlockColor {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

export function getAllBlockColors(): BlockColor[] {
  return [...BLOCK_COLORS];
}

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export function getDiaSemanaLabel(dia: number | null | undefined): string {
  if (dia == null || dia < 0 || dia > 6) return '';
  return DIAS_SEMANA[dia];
}
