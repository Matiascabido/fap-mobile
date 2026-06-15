/**
 * Colores para los bloques de plan de entrenamiento.
 * Replica planBlockColors.ts del frontend web.
 */

const BLOCK_COLORS = [
  { bg: '#dc2626', text: '#FFFFFF', light: '#fee2e2' },  // rojo
  { bg: '#2563eb', text: '#FFFFFF', light: '#dbeafe' },  // azul
  { bg: '#16a34a', text: '#FFFFFF', light: '#dcfce7' },  // verde
  { bg: '#d97706', text: '#FFFFFF', light: '#fef3c7' },  // naranja
  { bg: '#7c3aed', text: '#FFFFFF', light: '#ede9fe' },  // violeta
  { bg: '#0891b2', text: '#FFFFFF', light: '#cffafe' },  // cyan
  { bg: '#db2777', text: '#FFFFFF', light: '#fce7f3' },  // rosa
  { bg: '#65a30d', text: '#FFFFFF', light: '#ecfccb' },  // lima
  { bg: '#1d4ed8', text: '#FFFFFF', light: '#dbeafe' },  // indigo
  { bg: '#b45309', text: '#FFFFFF', light: '#fef3c7' },  // ámbar oscuro
];

export interface BlockColor {
  bg: string;
  text: string;
  light: string;
}

/**
 * Devuelve el color para el bloque en la posición `index`
 * (cíclico si hay más bloques que colores)
 */
export function getPlanBlockColor(index: number): BlockColor {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

/**
 * Devuelve todos los colores disponibles
 */
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

/**
 * Nombre del día de semana (0=lunes … 6=domingo)
 */
export function getDiaSemanaLabel(dia: number | null | undefined): string {
  if (dia == null || dia < 0 || dia > 6) return '';
  return DIAS_SEMANA[dia];
}
