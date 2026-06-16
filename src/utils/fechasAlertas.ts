/**
 * Parseo de fechas de calendario (AR) sin depender del locale del motor JS.
 * Una sola fuente para display y lógica de vencimiento.
 */

import { parseISO, isValid } from 'date-fns';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateFromParts(year: number, month: number, day: number): Date | null {
  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return startOfLocalDay(d);
}

/**
 * Parsea fechas ISO, `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY` y datetime con `T` o espacio.
 */
export function parseFechaLocal(raw: string | null | undefined): Date | null {
  const s = raw?.trim();
  if (!s) return null;

  // YYYY-MM-DD (también dentro de datetime)
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return dateFromParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }

  // Fallback date-fns (ISO completo con zona horaria)
  try {
    const parsed = parseISO(s);
    if (isValid(parsed)) {
      return startOfLocalDay(parsed);
    }
  } catch {
    /* ignore */
  }

  // Último intento: motor nativo
  const native = new Date(s.includes('T') ? s : s.replace(/-/g, '/'));
  if (!Number.isNaN(native.getTime())) {
    return startOfLocalDay(native);
  }

  return null;
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
  // Si no se puede parsear, no asumir vencida (evita falsos positivos)
  if (dias == null) return 'vigente';
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
