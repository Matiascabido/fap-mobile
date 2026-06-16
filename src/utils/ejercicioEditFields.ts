/** Campos PATCH `/ejercicios/{id}` editables en detalle del plan (staff y entrenado). */

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

function esUuidEjercicioId(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!s) return false;
  const hex = s.replace(/-/g, '');
  return hex.length === 32 && /^[0-9a-f]+$/i.test(hex);
}

/** UUID, entero u ObjectId usable en PATCH `/ejercicios/{id}`. */
export function normalizeCatalogEjercicioIdCandidate(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return String(Math.trunc(v));
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (esUuidEjercicioId(s)) return s;
  if (/^\d+$/.test(s)) return s;
  if (/^[a-f0-9]{24}$/i.test(s)) return s;
  return null;
}

export function resolveCatalogEjercicioId(
  item: { id_ejercicio?: string | null; ejercicio?: Record<string, unknown> | null },
  display?: Record<string, unknown>
): string | null {
  const fromItem = normalizeCatalogEjercicioIdCandidate(item.id_ejercicio);
  if (fromItem) return fromItem;

  const nestedObj = item.ejercicio;
  if (nestedObj && typeof nestedObj === 'object') {
    const fromNested =
      normalizeCatalogEjercicioIdCandidate(nestedObj.id) ??
      normalizeCatalogEjercicioIdCandidate(nestedObj.id_ejercicio) ??
      normalizeCatalogEjercicioIdCandidate(nestedObj._id);
    if (fromNested) return fromNested;
  }

  if (display) {
    const fromDisplayId = normalizeCatalogEjercicioIdCandidate(display.id_ejercicio);
    if (fromDisplayId) return fromDisplayId;
    const displayEj = display.ejercicio;
    if (displayEj && typeof displayEj === 'object') {
      const fromDisplayNested =
        normalizeCatalogEjercicioIdCandidate((displayEj as Record<string, unknown>).id) ??
        normalizeCatalogEjercicioIdCandidate((displayEj as Record<string, unknown>).id_ejercicio) ??
        normalizeCatalogEjercicioIdCandidate((displayEj as Record<string, unknown>)._id);
      if (fromDisplayNested) return fromDisplayNested;
    }
  }

  return null;
}
