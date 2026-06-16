/**
 * Utilidades de fechas para alertas de suscripciones y planes (calendario local AR).
 */

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Parsea ISO o `YYYY-MM-DD` a fecha local medianoche (ignora hora UTC del suffix `T…`). */
export function parseFechaLocal(raw: string | null | undefined): Date | null {
  const s = raw?.trim();
  if (!s) return null;
  const ymd = s.includes('T') ? s.split('T')[0]! : s.slice(0, 10);
  const d = new Date(ymd.replace(/-/g, '/'));
  if (Number.isNaN(d.getTime())) return null;
  return startOfLocalDay(d);
}

/** Días enteros desde hoy (0=hoy) hasta `target`. Negativo si ya pasó. */
export function diasHastaFecha(target: Date): number {
  const today = startOfLocalDay(new Date());
  const end = startOfLocalDay(target);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export function diasHastaVencimiento(fechaVencimiento: string | null | undefined): number | null {
  const end = parseFechaLocal(fechaVencimiento);
  if (!end) return null;
  return diasHastaFecha(end);
}

/** Vigente: hoy ≤ vencimiento */
export function suscripcionEstaVigente(fechaVencimiento: string | null | undefined): boolean {
  const dias = diasHastaVencimiento(fechaVencimiento);
  return dias != null && dias >= 0;
}

export function suscripcionVenceEnDias(
  fechaVencimiento: string | null | undefined,
  dias: number
): boolean {
  const d = diasHastaVencimiento(fechaVencimiento);
  return d != null && d >= 0 && d <= dias;
}

export function enUltimaSemanaAntesDeVencer(
  fechaVencimiento: string | null | undefined
): boolean {
  return suscripcionVenceEnDias(fechaVencimiento, 7);
}

export type EstadoSuscripcion = 'vigente' | 'por_vencer' | 'vencida';

export function calcularEstadoSuscripcion(
  fechaVencimiento: string | null | undefined
): EstadoSuscripcion {
  const dias = diasHastaVencimiento(fechaVencimiento);
  if (dias == null) return 'vencida';
  if (dias < 0) return 'vencida';
  if (dias <= 7) return 'por_vencer';
  return 'vigente';
}

export function formatFechaCortaAR(raw: string | null | undefined): string {
  const d = parseFechaLocal(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-AR');
}

/** Fecha en que se cumple un mes calendario desde la creación. */
export function fechaAniversarioUnMes(desde: Date): Date {
  const d = new Date(desde);
  d.setMonth(d.getMonth() + 1);
  return startOfLocalDay(d);
}

export function diasHastaAniversarioMes(createdRaw: string | null | undefined): number | null {
  const created = parseFechaLocal(createdRaw);
  if (!created) return null;
  return diasHastaFecha(fechaAniversarioUnMes(created));
}

export function mesPlanVencido(createdRaw: string | null | undefined): boolean {
  const dias = diasHastaAniversarioMes(createdRaw);
  return dias != null && dias <= 0;
}

export function planEnAvisoCincoDiasAntesMes(createdRaw: string | null | undefined): boolean {
  const dias = diasHastaAniversarioMes(createdRaw);
  return dias != null && dias > 0 && dias <= 5;
}
