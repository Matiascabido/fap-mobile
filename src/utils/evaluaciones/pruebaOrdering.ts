import type {
  EvaluacionGrupoResponse,
  EvaluacionPruebaResumen,
  EvaluacionSeccion,
} from '../../types/evaluaciones.types';

export interface PruebaConSeccion extends EvaluacionPruebaResumen {
  seccionId: string;
  seccionNombre: string;
  seccionOrden: number;
}

function sortByOrden<T extends { orden: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.orden - b.orden);
}

export function flattenPruebasFromGrupo(grupo: EvaluacionGrupoResponse): PruebaConSeccion[] {
  return sortByOrden(grupo.secciones ?? []).flatMap((seccion) =>
    sortByOrden(seccion.pruebas ?? []).map((prueba) => ({
      ...prueba,
      seccionId: seccion.id,
      seccionNombre: seccion.nombre,
      seccionOrden: seccion.orden,
    }))
  );
}

export function findGrupoForPruebaId(
  catalogo: EvaluacionGrupoResponse[],
  pruebaId: string
): EvaluacionGrupoResponse | null {
  for (const grupo of catalogo) {
    for (const seccion of grupo.secciones ?? []) {
      if ((seccion.pruebas ?? []).some((p) => p.id === pruebaId)) return grupo;
    }
  }
  return null;
}

export function findSeccionForPruebaId(
  grupo: EvaluacionGrupoResponse,
  pruebaId: string
): EvaluacionSeccion | null {
  for (const seccion of grupo.secciones ?? []) {
    if ((seccion.pruebas ?? []).some((p) => p.id === pruebaId)) return seccion;
  }
  return null;
}

export function getPruebaIdsFromGrupo(grupo: EvaluacionGrupoResponse): Set<string> {
  const ids = new Set<string>();
  for (const seccion of grupo.secciones ?? []) {
    for (const prueba of seccion.pruebas ?? []) ids.add(prueba.id);
  }
  return ids;
}
