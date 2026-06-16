import type { EvaluacionRegistroResumen } from '../../types/evaluaciones.types';
import {
  compareRegistrosCronologico,
  fechaEvaluacionHasTime,
  fechaEvaluacionYmd,
  parseRegistroInstant,
} from './evalRegistroDate';

export type RegistroFechaRef = Pick<
  EvaluacionRegistroResumen,
  'fecha_evaluacion' | 'created_date'
>;

export function formatHoraLocal(d = new Date()): string {
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatRegistroHora(registro: RegistroFechaRef): string | null {
  const d = parseRegistroInstant(registro);
  if (!d) return null;
  if (!fechaEvaluacionHasTime(registro.fecha_evaluacion) && !registro.created_date?.trim()) {
    return null;
  }
  return formatHoraLocal(d);
}

export function formatFechaSesionLegible(ymd: string): string {
  const [y, m, d] = fechaEvaluacionYmd(ymd).split('-').map(Number);
  if (!y || !m || !d) return 'Sin fecha';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRegistroFechaHora(registro: RegistroFechaRef): string {
  const d = parseRegistroInstant(registro);
  const ymd = fechaEvaluacionYmd(registro.fecha_evaluacion);
  if (!d) return formatFechaSesionLegible(ymd || registro.fecha_evaluacion);
  const withTime =
    fechaEvaluacionHasTime(registro.fecha_evaluacion) || !!registro.created_date?.trim();
  if (withTime) {
    return d.toLocaleString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return formatFechaSesionLegible(ymd);
}

export function formatRegistroTimeline(registro: RegistroFechaRef): string {
  const fecha = formatFechaTimeline(registro.fecha_evaluacion);
  const hora = formatRegistroHora(registro);
  return hora ? `${fecha} · ${hora}` : fecha;
}

export function formatSesionFechaHora(fechaRaw: string, registradoAt?: string | null): string {
  if (fechaEvaluacionHasTime(fechaRaw)) {
    return formatRegistroFechaHora({ fecha_evaluacion: fechaRaw, created_date: null });
  }
  return formatRegistroFechaHora({
    fecha_evaluacion: fechaRaw,
    created_date: registradoAt ?? null,
  });
}

export function formatFechaTimeline(ymd: string): string {
  const [y, m, d] = fechaEvaluacionYmd(ymd).split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${String(y).slice(-2)}`;
}

export function formatRangoFechas(desde: string, hasta: string): string {
  if (!desde || !hasta) return '—';
  const d = fechaEvaluacionYmd(desde);
  const h = fechaEvaluacionYmd(hasta);
  if (d === h) return formatFechaSesionLegible(d);
  return `${formatFechaSesionLegible(d)} → ${formatFechaSesionLegible(h)}`;
}

export function sortRegistrosCronologico<T extends EvaluacionRegistroResumen>(
  list: T[]
): T[] {
  const inputOrder = new Map(list.map((r, i) => [r.id, i]));
  return [...list].sort((a, b) => compareRegistrosCronologico(a, b, inputOrder));
}
