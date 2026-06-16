import { getAllBlockColors } from './planBlockColors';

/** Títulos sugeridos para bloques de plan con color asociado (igual que fap_frontend). */
export const BLOQUE_TITULOS_PRESET = [
  { nombre: 'Movilidad', color: '#4AD2FF' },
  { nombre: 'Activación', color: '#FF8C00' },
  { nombre: 'Estabilidad', color: '#00A86B' },
  { nombre: 'Saltabilidad', color: '#FFD700' },
  { nombre: 'Lanzamientos', color: '#FF0000' },
  { nombre: 'DLOP', color: '#8A2BE2' },
  { nombre: 'Desarrollo 1', color: '#D3D3D3' },
  { nombre: 'Desarrollo 2', color: '#808000' },
  { nombre: 'Desarrollo 3', color: '#B8860B' },
  { nombre: 'Desarrollo 4', color: '#FF4500' },
  { nombre: 'Desarrollo 5', color: '#8B0000' },
  { nombre: 'Desarrollo 6', color: '#2F4F4F' },
  { nombre: 'Intermitente', color: '#FF00FF' },
  { nombre: 'Vuelta a la calma', color: '#B0E0E6' },
] as const;

export type BloqueTituloPreset = (typeof BLOQUE_TITULOS_PRESET)[number];

export const DEFAULT_BLOQUE_COLOR = BLOQUE_TITULOS_PRESET[0].color;

export function colorPresetForBloqueTitulo(nombre: string): string | null {
  const t = nombre.trim().toLocaleLowerCase('es');
  if (!t) return null;
  const match = BLOQUE_TITULOS_PRESET.find((p) => p.nombre.toLocaleLowerCase('es') === t);
  return match?.color ?? null;
}

export function filterBloqueTitulosPreset(query: string): BloqueTituloPreset[] {
  const q = query.trim().toLocaleLowerCase('es');
  if (!q) return [...BLOQUE_TITULOS_PRESET];
  return BLOQUE_TITULOS_PRESET.filter((p) => p.nombre.toLocaleLowerCase('es').includes(q));
}

/** Paleta ampliada: presets + mates + colores extra del picker anterior. */
export function getBlockPickerColors(): string[] {
  const presetColors = BLOQUE_TITULOS_PRESET.map((p) => p.color);
  const extra = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#0891B2'];
  const matte = getAllBlockColors().map((c) => c.bg);
  return [...new Set([...presetColors, ...extra, ...matte])];
}
