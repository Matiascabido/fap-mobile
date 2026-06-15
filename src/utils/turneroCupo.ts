/**
 * Utilidades para detectar cupo lleno en turnos.
 */

export interface TurnoCupoInfo {
  cupos_maximos?: number | null;
  cupos_libres?: number | null;
  cantidad_inscriptos?: number | null;
}

/**
 * Detecta si un turno tiene cupo lleno
 */
export function turnoSinCupo(turno: TurnoCupoInfo): boolean {
  if (turno.cupos_libres != null) return turno.cupos_libres <= 0;
  if (turno.cantidad_inscriptos != null && turno.cupos_maximos != null) {
    return turno.cantidad_inscriptos >= turno.cupos_maximos;
  }
  return false;
}

/**
 * Porcentaje de ocupación (0-100)
 */
export function porcentajeOcupacion(turno: TurnoCupoInfo): number {
  const inscriptos = turno.cantidad_inscriptos ?? 0;
  const maximos = turno.cupos_maximos ?? 0;
  if (!maximos) return 0;
  return Math.min(100, Math.round((inscriptos / maximos) * 100));
}

/**
 * Cupos libres calculados
 */
export function cuposLibres(turno: TurnoCupoInfo): number {
  if (turno.cupos_libres != null) return Math.max(0, turno.cupos_libres);
  const inscriptos = turno.cantidad_inscriptos ?? 0;
  const maximos = turno.cupos_maximos ?? 0;
  return Math.max(0, maximos - inscriptos);
}
