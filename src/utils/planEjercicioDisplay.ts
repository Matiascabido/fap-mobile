import { PlanEjercicioItem } from '../types/planes.types';
import { EjercicioCatalogo } from '../services/api/ejercicios.service';

function strOrUndef(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

/** Une ítem del plan + ejercicio anidado + catálogo en un objeto plano para filas de detalle. */
export function planEjercicioToDisplay(
  item: PlanEjercicioItem,
  catalogo?: EjercicioCatalogo | null
): Record<string, unknown> {
  const nested =
    item.ejercicio && typeof item.ejercicio === 'object'
      ? (item.ejercicio as Record<string, unknown>)
      : {};
  const cat = catalogo as Record<string, unknown> | undefined;

  return {
    ...(cat ?? {}),
    ...nested,
    nombre: nested.nombre ?? cat?.nombre ?? 'Ejercicio',
    id_ejercicio: item.id_ejercicio ?? nested.id_ejercicio ?? cat?.id,
    id_video: item.id_video ?? nested.id_video ?? cat?.id_video,
    peso: strOrUndef(item.peso) ?? strOrUndef(nested.peso) ?? strOrUndef(cat?.peso),
    serie: strOrUndef(item.series) ?? strOrUndef(nested.serie) ?? strOrUndef(cat?.serie),
    repeticion:
      strOrUndef(item.reps) ??
      strOrUndef(nested.repeticion) ??
      strOrUndef(cat?.repeticion),
    descripcion: nested.descripcion ?? cat?.descripcion,
    observaciones: nested.observaciones ?? cat?.observaciones,
    rpe: nested.rpe ?? cat?.rpe,
    rir: nested.rir ?? cat?.rir,
    ce: nested.ce ?? cat?.ce,
    pausa_desde: nested.pausa_desde ?? cat?.pausa_desde,
    pausa_hasta: nested.pausa_hasta ?? cat?.pausa_hasta,
    video: nested.video ?? cat?.video,
    url_youtube: nested.url_youtube ?? cat?.url_youtube,
  };
}
