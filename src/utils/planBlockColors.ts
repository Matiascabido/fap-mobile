/**
 * Colores mate para bloques y planes de entrenamiento.
 */

const FALLBACK_BLOCK_COLOR = '#64748B';

/** Paleta mate fija (sin saturación chillona) */
const BLOCK_COLORS = [
  { bg: '#5C6B7A', text: '#F1F5F9', light: '#475569' },
  { bg: '#4A6FA5', text: '#F1F5F9', light: '#3D5A80' },
  { bg: '#5B7B6A', text: '#F1F5F9', light: '#456B55' },
  { bg: '#8B7355', text: '#F1F5F9', light: '#6B5844' },
  { bg: '#6B5B7A', text: '#F1F5F9', light: '#554A62' },
  { bg: '#4A7A7E', text: '#F1F5F9', light: '#3D6266' },
  { bg: '#7A5B6B', text: '#F1F5F9', light: '#624958' },
  { bg: '#6B7A4A', text: '#F1F5F9', light: '#556240' },
  { bg: '#556B8B', text: '#F1F5F9', light: '#44566E' },
  { bg: '#7A6B55', text: '#F1F5F9', light: '#625644' },
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')}`;
}

/** Mezcla un color del API con slate para obtener un tono mate consistente */
export function toMatteAccent(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return FALLBACK_BLOCK_COLOR;
  const slate = { r: 100, g: 116, b: 139 };
  const mix = 0.52;
  return rgbToHex(
    Math.round(rgb.r * mix + slate.r * (1 - mix)),
    Math.round(rgb.g * mix + slate.g * (1 - mix)),
    Math.round(rgb.b * mix + slate.b * (1 - mix))
  );
}

export function resolveBlockColor(
  bloque: { color?: string | null } | null | undefined,
  index = 0
): string {
  const fromApi = colorFromBloqueItem(bloque);
  if (fromApi) return toMatteAccent(fromApi);
  return BLOCK_COLORS[index % BLOCK_COLORS.length]!.bg;
}

export function blockColorsFromPlan(bloques: unknown[]): string[] {
  const out: string[] = [];
  bloques.forEach((b, i) => {
    out.push(resolveBlockColor(b as { color?: string | null }, i));
  });
  return out.length > 0 ? out : [FALLBACK_BLOCK_COLOR];
}

/** Mezcla todos los colores mate de bloques en un solo tono representativo */
export function blendBlockColors(colors: string[]): string {
  if (colors.length === 0) return FALLBACK_BLOCK_COLOR;
  if (colors.length === 1) return colors[0];

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const hex of colors) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;
    r += rgb.r;
    g += rgb.g;
    b += rgb.b;
    count += 1;
  }

  if (count === 0) return FALLBACK_BLOCK_COLOR;
  return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
}

export function planColorPaletteFromBlocks(bloques: unknown[]): {
  stripeColors: string[];
  blendedAccent: string;
} {
  const stripeColors = blockColorsFromPlan(bloques);
  return {
    stripeColors,
    blendedAccent: blendBlockColors(stripeColors),
  };
}

/** Colores para gradiente horizontal (expo-linear-gradient requiere ≥2) */
export function gradientColorsFromBlocks(colors: string[]): string[] {
  if (colors.length === 0) return [FALLBACK_BLOCK_COLOR, FALLBACK_BLOCK_COLOR];
  if (colors.length === 1) return [colors[0], colors[0]];
  return colors;
}

export function getPlanBlockColor(index: number): BlockColor {
  return BLOCK_COLORS[index % BLOCK_COLORS.length]!;
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
