/** Campos PATCH `/ejercicios/{id}` editables en detalle del plan (solo staff). */

export type EjercicioPatchField = 'serie' | 'repeticion' | 'peso';

export const EDITABLE_FIELD_BY_LABEL: Record<string, EjercicioPatchField> = {
  Series: 'serie',
  Repeticiones: 'repeticion',
  Peso: 'peso',
};

/** Únicos campos que el usuario puede modificar dentro del plan. */
export const EDITABLE_PRESCRIPTION_LABELS = ['Series', 'Repeticiones', 'Peso'] as const;

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
