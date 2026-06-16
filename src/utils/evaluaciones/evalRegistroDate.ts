import type { EvaluacionRegistroResumen } from '../../types/evaluaciones.types';

export type RegistroFechaFields = Pick<
  EvaluacionRegistroResumen,
  'fecha_evaluacion' | 'created_date'
>;

/** Formato del backend: `YYYY-MM-DDTHH:mm:ss` (T mayúscula o minúscula, sin zona horaria). */
export const FECHA_EVALUACION_DATETIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;

function asDateString(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return String(raw).trim();
}

export function normalizeFechaEvaluacion(raw: unknown): string {
  return asDateString(raw);
}

export function fechaEvaluacionYmd(raw: string | null | undefined): string {
  const s = asDateString(raw);
  if (!s) return '';
  return s.slice(0, 10);
}

export function fechaEvaluacionHasTime(raw: string | null | undefined): boolean {
  const s = asDateString(raw);
  if (!s) return false;
  if (FECHA_EVALUACION_DATETIME_RE.test(s)) return true;
  if (/[Tt]\d/.test(s)) return true;
  return /\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}/.test(s);
}

export function parseFechaEvaluacionDateTimeLocal(raw: string): Date | null {
  const s = asDateString(raw);
  const m = s.match(FECHA_EVALUACION_DATETIME_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const sec = Number(m[6]);
  if (!y || !mo || !d) return null;
  const date = new Date(y, mo - 1, d, h, mi, sec);
  if (!Number.isFinite(date.getTime())) return null;
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function parseFechaEvaluacion(raw: string | null | undefined): Date | null {
  const s = asDateString(raw);
  if (!s) return null;

  const backendLocal = parseFechaEvaluacionDateTimeLocal(s);
  if (backendLocal) return backendLocal;

  const parsed = Date.parse(s);
  if (Number.isFinite(parsed)) return new Date(parsed);

  const [y, m, d] = fechaEvaluacionYmd(s).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function parseRegistroInstant(registro: RegistroFechaFields): Date | null {
  const fecha = asDateString(registro.fecha_evaluacion);
  if (fecha && fechaEvaluacionHasTime(fecha)) {
    const d = parseFechaEvaluacion(fecha);
    if (d && Number.isFinite(d.getTime())) return d;
  }

  const created = asDateString(registro.created_date);
  if (created) {
    const d = parseFechaEvaluacion(created);
    if (d && Number.isFinite(d.getTime())) return d;
  }

  return parseFechaEvaluacion(fecha);
}

export function registroSortTimestamp(registro: RegistroFechaFields): number {
  const d = parseRegistroInstant(registro);
  return d && Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

export function registroInstantRaw(registro: RegistroFechaFields): string | null {
  const fecha = asDateString(registro.fecha_evaluacion);
  if (fecha && fechaEvaluacionHasTime(fecha)) return fecha;
  const created = asDateString(registro.created_date);
  if (created) return created;
  return fecha || null;
}

export function buildRegistroInputOrder(
  registros: EvaluacionRegistroResumen[]
): Map<string, number> {
  return new Map(registros.map((r, i) => [r.id, i]));
}

export function compareRegistrosCronologico(
  a: EvaluacionRegistroResumen,
  b: EvaluacionRegistroResumen,
  inputOrder?: Map<string, number>
): number {
  const diff = registroSortTimestamp(a) - registroSortTimestamp(b);
  if (diff !== 0) return diff;
  if (inputOrder) {
    const oa = inputOrder.get(a.id);
    const ob = inputOrder.get(b.id);
    if (oa != null && ob != null && oa !== ob) return ob - oa;
  }
  return a.id.localeCompare(b.id);
}
