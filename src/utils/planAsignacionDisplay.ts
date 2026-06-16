import { AsignacionPlan, PlanWithRelations } from '../types/planes.types';

export type PlanAsignacionViewer = 'entrenado' | 'profesional' | 'admin';

export function resolvePlanAsignacionViewer(
  isAdmin: boolean,
  isProfesional: boolean
): PlanAsignacionViewer {
  if (isAdmin) return 'admin';
  if (isProfesional) return 'profesional';
  return 'entrenado';
}

function joinNombre(nombre?: string | null, apellido?: string | null): string {
  return [nombre?.trim(), apellido?.trim()].filter(Boolean).join(' ').trim();
}

export function asignacionNombreSocio(asignacion: AsignacionPlan): string | null {
  const direct = asignacion.nombre_socio?.trim();
  if (direct) return direct;
  const nested = joinNombre(asignacion.socio?.nombre, asignacion.socio?.apellido);
  return nested || null;
}

export function asignacionNombreProfesional(asignacion: AsignacionPlan): string | null {
  const direct = asignacion.nombre_profesional?.trim();
  if (direct) return direct;
  const nested = joinNombre(asignacion.profesional?.nombre, asignacion.profesional?.apellido);
  return nested || null;
}

export function primaryAsignacion(item: PlanWithRelations): AsignacionPlan | null {
  const list = item.asignaciones ?? [];
  if (list.length === 0) return null;
  const activa = list.find((a) => a.activo);
  return activa ?? list[0];
}

/** Texto de asignación en listado de planes según quién ve la app. */
export function planAsignacionDisplayText(
  asignacion: AsignacionPlan | null | undefined,
  viewer: PlanAsignacionViewer
): string | null {
  if (!asignacion) return null;

  const socio = asignacionNombreSocio(asignacion);
  const prof = asignacionNombreProfesional(asignacion);

  switch (viewer) {
    case 'entrenado':
      return prof ? `Profesional: ${prof}` : null;
    case 'profesional':
      return socio ? `Socio: ${socio}` : null;
    case 'admin':
      if (prof && socio) return `${prof} → ${socio}`;
      if (socio) return `Socio: ${socio}`;
      if (prof) return `Profesional: ${prof}`;
      return null;
    default:
      return null;
  }
}

export function planAsignacionDisplayFromItem(
  item: PlanWithRelations,
  viewer: PlanAsignacionViewer
): string | null {
  return planAsignacionDisplayText(primaryAsignacion(item), viewer);
}
