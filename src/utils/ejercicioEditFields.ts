/** Campos PATCH `/ejercicios/{id}` editables en detalle del plan. */

export type EjercicioPatchField =
  | 'serie'
  | 'repeticion'
  | 'peso'
  | 'rpe'
  | 'rir'
  | 'ce'
  | 'pausa_desde'
  | 'pausa_hasta'
  | 'observaciones'
  | 'descripcion';

export const EDITABLE_FIELD_BY_LABEL: Record<string, EjercicioPatchField> = {
  Series: 'serie',
  Repeticiones: 'repeticion',
  Peso: 'peso',
  RPE: 'rpe',
  RIR: 'rir',
  'C.E.': 'ce',
  'Pausa desde': 'pausa_desde',
  'Pausa hasta': 'pausa_hasta',
  Observaciones: 'observaciones',
  Descripción: 'descripcion',
};

/** Prescripción principal (siempre visible para edición). */
export const PRIMARY_PRESCRIPTION_LABELS = ['Series', 'Repeticiones', 'Peso'] as const;

/** Campos extra de prescripción editables. */
export const EXTRA_PRESCRIPTION_LABELS = [
  'RPE',
  'RIR',
  'C.E.',
  'Pausa desde',
  'Pausa hasta',
] as const;

export const FIELD_MAX = 100;

export function displayValueForField(
  display: Record<string, unknown>,
  field: EjercicioPatchField
): string {
  const v = display[field];
  if (v == null) return '';
  const s = String(v).trim();
  return s;
}

export function resolveCatalogEjercicioId(
  item: { id_ejercicio?: string | null; ejercicio?: Record<string, unknown> | null },
  display?: Record<string, unknown>
): string | null {
  const fromItem = item.id_ejercicio;
  if (fromItem != null && String(fromItem).trim()) return String(fromItem).trim();
  const nested = item.ejercicio?.id ?? item.ejercicio?.id_ejercicio;
  if (nested != null && String(nested).trim()) return String(nested).trim();
  const fromDisplay = display?.id_ejercicio ?? display?.id;
  if (fromDisplay != null && String(fromDisplay).trim()) return String(fromDisplay).trim();
  return null;
}
