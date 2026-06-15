/**
 * Utilidades de alertas de vencimiento para suscripciones y planes.
 * Replica fechasAlertas.ts del frontend web.
 * Las fechas se manejan en calendario local AR (sin conversión TZ).
 */

import { differenceInDays, parseISO, isValid } from 'date-fns';

/** Parsea una fecha string (YYYY-MM-DD o ISO) de forma segura */
export function parseFechaLocal(fechaStr: string | null | undefined): Date | null {
  if (!fechaStr) return null;
  try {
    const d = parseISO(fechaStr);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Retorna los días hasta el vencimiento (negativo = ya venció)
 */
export function diasHastaFecha(fechaStr: string | null | undefined): number {
  const fecha = parseFechaLocal(fechaStr);
  if (!fecha) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return differenceInDays(fecha, hoy);
}

/**
 * suscripcionEstaVigente: hoy ≤ vencimiento
 */
export function suscripcionEstaVigente(fechaVencimiento: string | null | undefined): boolean {
  const dias = diasHastaFecha(fechaVencimiento);
  return dias >= 0;
}

/**
 * Suscripción vence en los próximos N días (inclusive)
 */
export function suscripcionVenceEnDias(
  fechaVencimiento: string | null | undefined,
  dias: number
): boolean {
  const d = diasHastaFecha(fechaVencimiento);
  return d >= 0 && d <= dias;
}

/**
 * En última semana antes de vencer (0–7 días)
 */
export function enUltimaSemanaAntesDeVencer(
  fechaVencimiento: string | null | undefined
): boolean {
  return suscripcionVenceEnDias(fechaVencimiento, 7);
}

/**
 * Calcula estado de suscripción: 'vigente' | 'por_vencer' | 'vencida'
 */
export type EstadoSuscripcion = 'vigente' | 'por_vencer' | 'vencida';

export function calcularEstadoSuscripcion(
  fechaVencimiento: string | null | undefined
): EstadoSuscripcion {
  const dias = diasHastaFecha(fechaVencimiento);
  if (dias < 0) return 'vencida';
  if (dias <= 7) return 'por_vencer';
  return 'vigente';
}

/**
 * Plan: ha pasado ~1 mes desde creación sin nuevos ejercicios
 */
export function mesPlanVencido(fechaCreacion: string | null | undefined): boolean {
  const fecha = parseFechaLocal(fechaCreacion);
  if (!fecha) return false;
  const hoy = new Date();
  const diff = differenceInDays(hoy, fecha);
  return diff >= 30;
}

/**
 * Plan: faltan 1–5 días para cumplir el mes
 */
export function planEnAvisoCincoDiasAntesMes(
  fechaCreacion: string | null | undefined
): boolean {
  const fecha = parseFechaLocal(fechaCreacion);
  if (!fecha) return false;
  const hoy = new Date();
  const diasDesdeCreacion = differenceInDays(hoy, fecha);
  const diasHastaMes = 30 - diasDesdeCreacion;
  return diasHastaMes >= 1 && diasHastaMes <= 5;
}
