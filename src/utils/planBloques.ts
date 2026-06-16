import { PlanWithRelations, Bloque, PlanBloqueRelacion } from '../types/planes.types';

export function resolvePlanBloqueId(rel: PlanBloqueRelacion, bloque?: Bloque): string | null {
  return (
    rel.id_plan_bloque ??
    rel.id ??
    rel.bloque?.id_plan_bloque ??
    rel.bloque?.id ??
    bloque?.id_plan_bloque ??
    bloque?.id_fila_plan_bloque ??
    bloque?.id ??
    null
  );
}

function relacionToBloque(rel: PlanBloqueRelacion, diaSemana?: number | null): Bloque {
  const planBloqueId = resolvePlanBloqueId(rel);
  return {
    ...rel.bloque,
    ejercicios: rel.ejercicios || rel.bloque.ejercicios,
    dia_semana: rel.dia_semana ?? diaSemana ?? rel.bloque.dia_semana,
    orden_en_plan: rel.orden ?? rel.bloque.orden_en_plan,
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

export function getEjercicioNombre(ejercicio: {
  ejercicio?: Record<string, unknown> | null;
}): string {
  return (
    (ejercicio.ejercicio?.nombre as string) ||
    (ejercicio.ejercicio?.nombre_ejercicio as string) ||
    'Ejercicio'
  );
}
