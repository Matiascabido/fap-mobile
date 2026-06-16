import {
  PlanWithRelations,
  Bloque,
  PlanBloqueRelacion,
  PlanEjercicioItem,
} from '../types/planes.types';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/** El API a veces devuelve filas vacías al crear el bloque (sin id ni nombre); no las mostramos. */
export function ejercicioItemListable(item: PlanEjercicioItem): boolean {
  const id = item.id_ejercicio;
  if (id != null && String(id).trim() !== '') return true;
  const ej = asRecord(item.ejercicio);
  if (ej) {
    const n = ej.nombre;
    if (typeof n === 'string' && n.trim()) return true;
  }
  return false;
}

export function filterListableEjercicios(
  items: PlanEjercicioItem[] | null | undefined
): PlanEjercicioItem[] {
  return (items ?? []).filter(ejercicioItemListable);
}

export function pickPlanBloqueIdsFromApiPayload(created: unknown): {
  idBloque: string | null;
  idPlanBloque: string | null;
} {
  const o = asRecord(created);
  if (!o) return { idBloque: null, idPlanBloque: null };
  const nested = asRecord(o.bloque);

  const idPlanBloque = firstNonEmptyString(
    o.id_fila_plan_bloque,
    o.id_plan_bloque,
    o.plan_bloque_id,
    nested?.id_fila_plan_bloque,
    nested?.id_plan_bloque,
    nested?.plan_bloque_id
  );

  const idBloque = firstNonEmptyString(
    o.id_bloque,
    o.bloque_id,
    nested?.id,
    nested?.id_bloque,
    nested?.bloque_id
  );

  // `id` en la raíz puede ser PK de plan_bloques o id del bloque maestro; no mezclar con id_bloque.
  if (!idPlanBloque) {
    const rootId = firstNonEmptyString(o.id);
    if (rootId && (!idBloque || rootId !== idBloque)) {
      return { idBloque: idBloque ?? rootId, idPlanBloque: rootId };
    }
  }

  return { idBloque, idPlanBloque };
}

/** PK `plan_bloques` en una fila de ejercicio del GET `/planes`. */
export function planBloqueLinkIdFromEjercicioRow(row: unknown): string | null {
  const o = asRecord(row);
  if (!o) return null;
  return firstNonEmptyString(o.id_fila_plan_bloque, o.id_plan_bloque, o.plan_bloque_id);
}

/** Id del vínculo `plan_bloques` para rutas `/planes/.../plan-bloques/{id}`. */
export function referencePlanBloqueId(bloque: Bloque): string | null {
  const root = firstNonEmptyString(bloque.id_plan_bloque, bloque.id_fila_plan_bloque);
  if (root) return root;
  for (const raw of bloque.ejercicios ?? []) {
    const pb = planBloqueLinkIdFromEjercicioRow(raw);
    if (pb) return pb;
  }
  return null;
}

export function resolvePlanBloqueId(rel: PlanBloqueRelacion, bloque?: Bloque): string | null {
  const fromRel = firstNonEmptyString(
    rel.id_plan_bloque,
    rel.id_fila_plan_bloque,
    rel.id
  );
  if (fromRel) return fromRel;

  const b = bloque ?? rel.bloque;
  if (!b) return null;
  return referencePlanBloqueId(b);
}

export function relacionToBloque(rel: PlanBloqueRelacion, diaSemana?: number | null): Bloque {
  const merged: Bloque = {
    ...rel.bloque,
    ejercicios: rel.ejercicios || rel.bloque.ejercicios,
    dia_semana: rel.dia_semana ?? diaSemana ?? rel.bloque.dia_semana,
    orden_en_plan: rel.orden ?? rel.bloque.orden_en_plan,
    id_plan_bloque: rel.id_plan_bloque ?? rel.bloque.id_plan_bloque ?? undefined,
    id_fila_plan_bloque:
      rel.id_fila_plan_bloque ?? rel.bloque.id_fila_plan_bloque ?? undefined,
  };
  const planBloqueId = resolvePlanBloqueId(rel, merged);
  return {
    ...merged,
    id_plan_bloque: planBloqueId ?? undefined,
    id_fila_plan_bloque: planBloqueId ?? undefined,
  };
}

/** Normaliza los bloques a una estructura uniforme (Bloque[]) */
export function normalizeBloques(planData: PlanWithRelations): Bloque[] {
  const result: Bloque[] = [];

  if (planData.bloques_por_dia && planData.bloques_por_dia.length > 0) {
    for (const grupo of planData.bloques_por_dia) {
      for (const rel of grupo.bloques) {
        result.push(relacionToBloque(rel, grupo.dia_semana));
      }
    }
    return result;
  }

  for (const b of planData.bloques || []) {
    if ('bloque' in b) {
      result.push(relacionToBloque(b as PlanBloqueRelacion));
    } else {
      const bloque = b as Bloque;
      const planBloqueId = resolvePlanBloqueId({ bloque } as PlanBloqueRelacion, bloque);
      result.push({
        ...bloque,
        id_plan_bloque: bloque.id_plan_bloque ?? planBloqueId ?? undefined,
        id_fila_plan_bloque: bloque.id_fila_plan_bloque ?? planBloqueId ?? undefined,
      });
    }
  }

  return result;
}

export function bloquesFromRelations(
  relaciones: PlanBloqueRelacion[],
  diaSemana?: number | null
): Bloque[] {
  return relaciones.map((rel) => relacionToBloque(rel, diaSemana));
}

export function getEjercicioNombre(ejercicio: {
  ejercicio?: Record<string, unknown> | null;
}): string {
  return (
    (ejercicio.ejercicio?.nombre as string) ||
    (ejercicio.ejercicio?.nombre_ejercicio as string) ||
    'Ejercicio'
  );
}
