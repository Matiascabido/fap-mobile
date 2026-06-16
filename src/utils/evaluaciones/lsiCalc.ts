import type {
  EvaluacionCampoResponse,
  EvaluacionRegistroResponse,
  PruebaFormValues,
  ValorFormState,
} from '../../types/evaluaciones.types';
import { flattenCamposParaValidacion } from './evaluacionValores';

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export function isIzquierdaCampo(c: EvaluacionCampoResponse): boolean {
  const n = norm(c.nombre);
  const code = norm(c.codigo);
  return (
    n === 'izquierda' ||
    n === 'i' ||
    n.includes('izquierd') ||
    code.includes('izquierd') ||
    code.endsWith('_i') ||
    code.endsWith('_izq')
  );
}

export function isDerechaCampo(c: EvaluacionCampoResponse): boolean {
  const n = norm(c.nombre);
  const code = norm(c.codigo);
  return (
    n === 'derecha' ||
    n === 'd' ||
    n.includes('derech') ||
    code.includes('derech') ||
    code.endsWith('_d') ||
    code.endsWith('_der')
  );
}

function findParentContainer(
  campos: EvaluacionCampoResponse[],
  targetId: string
): EvaluacionCampoResponse | null {
  for (const c of campos) {
    if (c.hijos?.some((h) => h.id === targetId)) return c;
    if (c.hijos?.length) {
      const nested = findParentContainer(c.hijos, targetId);
      if (nested) return nested;
    }
  }
  return null;
}

function sortByOrden(list: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  return [...list].sort((a, b) => a.orden - b.orden);
}

function pairFromSiblingList(
  siblings: EvaluacionCampoResponse[],
  lsiCampo: EvaluacionCampoResponse,
  excludeIds?: ReadonlySet<string>
): { izq: EvaluacionCampoResponse; der: EvaluacionCampoResponse } | null {
  const available = siblings.filter(
    (c) => c.id !== lsiCampo.id && (!excludeIds || !excludeIds.has(c.id))
  );

  const beforeLsi = available.filter((c) => c.orden < lsiCampo.orden);
  const derBefore = sortByOrden(beforeLsi.filter(isDerechaCampo)).pop();
  const izqBefore = sortByOrden(beforeLsi.filter(isIzquierdaCampo)).pop();
  if (derBefore && izqBefore) return { der: derBefore, izq: izqBefore };

  const der = available.find(isDerechaCampo);
  const izq = available.find(isIzquierdaCampo);
  if (der && izq) return { der, izq };

  return null;
}

/** Busca los campos numéricos Izq/Der hermanos del campo LSI. */
export function findPairForLsi(
  campos: EvaluacionCampoResponse[],
  lsiCampo: EvaluacionCampoResponse,
  excludeIds?: ReadonlySet<string>
): { izq: EvaluacionCampoResponse; der: EvaluacionCampoResponse } | null {
  const parent = findParentContainer(campos, lsiCampo.id);
  if (parent?.hijos?.length) {
    const pair = pairFromSiblingList(parent.hijos, lsiCampo, excludeIds);
    if (pair) return pair;
  }

  return pairFromSiblingList(campos, lsiCampo, excludeIds);
}

export function parseNumericValue(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** LSI = MIN(izq, der) / MAX(izq, der) */
export function computeLsiRatio(izq: number, der: number): number | null {
  const max = Math.max(izq, der);
  if (max === 0) return null;
  return Math.min(izq, der) / max;
}

export function formatLsiRatio(ratio: number | null): string {
  if (ratio == null) return '—';
  return ratio.toFixed(2);
}

function readNumericFromState(state: ValorFormState | undefined): number | null {
  if (!state || state.kind !== 'numerico') return null;
  return parseNumericValue(state.value);
}

export function computeLsiFromFormValues(
  campos: EvaluacionCampoResponse[],
  lsiCampo: EvaluacionCampoResponse,
  values: PruebaFormValues
): number | null {
  const pair = findPairForLsi(campos, lsiCampo);
  if (!pair) return null;
  const izq = readNumericFromState(values[pair.izq.id]);
  const der = readNumericFromState(values[pair.der.id]);
  if (izq == null || der == null) return null;
  return computeLsiRatio(izq, der);
}

export function computeLsiFromRegistro(
  campos: EvaluacionCampoResponse[],
  lsiCampo: EvaluacionCampoResponse,
  registro: EvaluacionRegistroResponse
): number | null {
  const pair = findPairForLsi(campos, lsiCampo);
  if (!pair) return null;
  return computeLsiFromCamposPair(registro, pair.der, pair.izq);
}

/** LSI a partir de los valores Der/Izq guardados en el registro (sin depender de campo LSI). */
export function computeLsiFromCamposPair(
  registro: EvaluacionRegistroResponse,
  der: EvaluacionCampoResponse,
  izq: EvaluacionCampoResponse
): number | null {
  const byCampo = new Map(registro.valores.map((v) => [v.id_campo, v]));
  const derVal = parseNumericValue(byCampo.get(der.id)?.valor_numerico);
  const izqVal = parseNumericValue(byCampo.get(izq.id)?.valor_numerico);
  if (derVal == null || izqVal == null) return null;
  return computeLsiRatio(izqVal, derVal);
}

export function applyComputedLsiToValues(
  campos: EvaluacionCampoResponse[],
  values: PruebaFormValues
): PruebaFormValues {
  const next = { ...values };
  for (const campo of flattenCamposParaValidacion(campos)) {
    if (campo.tipo_valor !== 'LSI') continue;
    const ratio = computeLsiFromFormValues(campos, campo, values);
    next[campo.id] = {
      kind: 'numerico',
      value: ratio != null ? String(ratio) : '',
    };
  }
  return next;
}
