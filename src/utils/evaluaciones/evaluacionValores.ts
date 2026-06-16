import type {
  EvaluacionCampoResponse,
  EvaluacionRegistroResumenResponse,
  EvaluacionRegistroResponse,
  EvaluacionValorInput,
  EvaluacionValorResponse,
  LateralidadEvaluacion,
  PruebaFormValues,
  TipoValorEvaluacion,
  ValorFormState,
} from '../../types/evaluaciones.types';
import { computeLsiFromRegistro, formatLsiRatio, parseNumericValue } from './lsiCalc';

/** Enteros sin decimales; hasta 2 decimales si corresponde. */
export function formatNumericForDisplay(raw: string | number | null | undefined): string {
  if (raw == null || raw === '') return '—';
  const n = parseNumericValue(raw);
  if (n == null) return String(raw);
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(Math.trunc(rounded));
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

const LATERALIDAD_LABELS: Record<LateralidadEvaluacion, string> = {
  izquierda: 'Izquierda',
  derecha: 'Derecha',
  bilateral: 'Bilateral',
  no: 'No',
};

export const LATERALIDAD_STD_OPTS: { value: LateralidadEvaluacion; label: string }[] = [
  { value: 'izquierda', label: 'Izquierda' },
  { value: 'derecha', label: 'Derecha' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'no', label: 'No' },
];

/** Normaliza texto de opción backend → enum de lateralidad. */
export function normalizeLateralidadValue(raw: string | null | undefined): LateralidadEvaluacion | null {
  if (!raw?.trim()) return null;
  const s = raw.trim().toLowerCase();
  if (s === 'izquierda' || s === 'i' || s === 'izq' || s === 'izquierdo') return 'izquierda';
  if (s === 'derecha' || s === 'd' || s === 'der' || s === 'derecho') return 'derecha';
  if (s === 'bilateral' || s === 'bi' || s === 'b' || s === 'bil') return 'bilateral';
  if (s === 'no' || s === 'n' || s === 'ninguno' || s === 'ninguna') return 'no';
  return null;
}

/** Opciones de chip para campos LATERALIDAD (con o sin `opciones` del backend). */
export function lateralidadOptionsFromCampo(
  campo: EvaluacionCampoResponse
): { value: LateralidadEvaluacion; label: string }[] {
  const opciones = [...(campo.opciones ?? [])].sort((a, b) => a.orden - b.orden);
  if (opciones.length > 0) {
    const mapped = opciones
      .map((o) => {
        const value =
          normalizeLateralidadValue(o.valor) ?? normalizeLateralidadValue(o.etiqueta);
        if (!value) return null;
        return { value, label: o.etiqueta?.trim() || LATERALIDAD_LABELS[value] };
      })
      .filter((x): x is { value: LateralidadEvaluacion; label: string } => x != null);
    if (mapped.length > 0) return mapped;
  }
  return LATERALIDAD_STD_OPTS;
}

export function flattenCamposParaValidacion(campos: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  const out: EvaluacionCampoResponse[] = [];
  const seen = new Set<string>();
  const walk = (list: EvaluacionCampoResponse[]) => {
    for (const c of list) {
      if (c.tipo_valor === 'CONTENEDOR') {
        if (c.hijos?.length) walk(c.hijos);
        continue;
      }
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (c.hijos?.length) walk(c.hijos);
    }
  };
  walk(campos);
  return out;
}

export function isValorFilled(campo: EvaluacionCampoResponse, state: ValorFormState | undefined): boolean {
  if (campo.tipo_valor === 'LSI') return false;
  if (!state) return false;
  switch (campo.tipo_valor) {
    case 'LATERALIDAD':
      return state.kind === 'lateralidad' && state.value !== '';
    case 'BOOLEAN':
      return state.kind === 'boolean' && state.value !== null;
    case 'NUMERICO':
      return state.kind === 'numerico' && state.value.trim() !== '';
    case 'FECHA':
      return state.kind === 'fecha' && state.value.trim() !== '';
    case 'TEXTO':
      return state.kind === 'texto' && state.value.trim() !== '';
    default:
      if ((campo.opciones?.length ?? 0) > 0) {
        return state.kind === 'opcion' && state.value !== '';
      }
      return false;
  }
}

export function validatePruebaCampos(
  campos: EvaluacionCampoResponse[],
  values: PruebaFormValues
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const campo of flattenCamposParaValidacion(campos)) {
    if (campo.tipo_valor === 'LSI') continue;
    if (!campo.es_obligatorio) continue;
    if (!isValorFilled(campo, values[campo.id])) {
      errors[campo.id] = `${campo.nombre} es obligatorio`;
    }
  }
  return errors;
}

export function buildValorInput(
  campo: EvaluacionCampoResponse,
  state: ValorFormState | undefined
): EvaluacionValorInput | null {
  if (!state || !isValorFilled(campo, state)) return null;

  const base: EvaluacionValorInput = { id_campo: campo.id };

  switch (campo.tipo_valor) {
    case 'LATERALIDAD':
      if (state.kind !== 'lateralidad' || !state.value) return null;
      // Backend LATERALIDAD: exactamente un valor → solo `valor_lateralidad` (no id_opcion).
      return { ...base, valor_lateralidad: state.value };
    case 'BOOLEAN':
      return state.kind === 'boolean' ? { ...base, valor_boolean: state.value } : null;
    case 'LSI':
      return null;
    case 'NUMERICO': {
      if (state.kind !== 'numerico') return null;
      const n = Number(state.value);
      return { ...base, valor_numerico: Number.isFinite(n) ? n : state.value };
    }
    case 'FECHA':
      return state.kind === 'fecha' ? { ...base, valor_fecha: state.value || null } : null;
    case 'TEXTO':
      return state.kind === 'texto' ? { ...base, valor_texto: state.value || null } : null;
    default:
      if ((campo.opciones?.length ?? 0) > 0 && state.kind === 'opcion') {
        return { ...base, id_opcion: state.value };
      }
      return null;
  }
}

export function buildValoresPayload(
  campos: EvaluacionCampoResponse[],
  values: PruebaFormValues
): EvaluacionValorInput[] {
  return sanitizeValoresPayload(
    flattenCamposParaValidacion(campos)
      .filter((campo) => campo.tipo_valor !== 'LSI')
      .map((campo) => buildValorInput(campo, values[campo.id]))
      .filter((input): input is EvaluacionValorInput => input != null)
  );
}

const LATERALIDAD_VALIDAS = new Set<LateralidadEvaluacion>([
  'izquierda',
  'derecha',
  'bilateral',
  'no',
]);

/** Elimina duplicados y campos vacíos antes del POST. */
export function sanitizeValoresPayload(valores: EvaluacionValorInput[]): EvaluacionValorInput[] {
  const byCampo = new Map<string, EvaluacionValorInput>();
  for (const raw of valores) {
    if (!raw.id_campo?.trim()) continue;
    const v: EvaluacionValorInput = { id_campo: raw.id_campo };
    if (raw.valor_lateralidad && LATERALIDAD_VALIDAS.has(raw.valor_lateralidad)) {
      v.valor_lateralidad = raw.valor_lateralidad;
    } else if (raw.id_opcion) {
      v.id_opcion = raw.id_opcion;
    }
    if (raw.valor_boolean != null) v.valor_boolean = raw.valor_boolean;
    if (raw.valor_numerico != null && raw.valor_numerico !== '') v.valor_numerico = raw.valor_numerico;
    if (raw.valor_fecha) v.valor_fecha = raw.valor_fecha;
    if (raw.valor_texto) v.valor_texto = raw.valor_texto;
    const hasValue =
      v.valor_lateralidad != null ||
      v.id_opcion != null ||
      v.valor_boolean != null ||
      (v.valor_numerico != null && v.valor_numerico !== '') ||
      !!v.valor_fecha ||
      !!v.valor_texto;
    if (hasValue) byCampo.set(v.id_campo, v);
  }
  return [...byCampo.values()];
}

/** Normaliza borradores viejos (p. ej. lateralidad guardada como `opcion`). */
export function mergeDraftValues(
  campos: EvaluacionCampoResponse[],
  draft: PruebaFormValues | null | undefined
): PruebaFormValues {
  const flat = flattenCamposParaValidacion(campos);
  const values: PruebaFormValues = {};
  for (const campo of flat) {
    values[campo.id] = coerceValorState(campo, draft?.[campo.id]);
  }
  return values;
}

function coerceValorState(
  campo: EvaluacionCampoResponse,
  state: ValorFormState | undefined
): ValorFormState {
  if (!state) return defaultValorState(campo);

  if (campo.tipo_valor === 'LATERALIDAD') {
    if (state.kind === 'lateralidad' && state.value) return state;
    if (state.kind === 'opcion' && state.value) {
      const opt = campo.opciones?.find((o) => o.id === state.value);
      const lat = opt
        ? normalizeLateralidadValue(opt.valor) ?? normalizeLateralidadValue(opt.etiqueta)
        : normalizeLateralidadValue(state.value);
      if (lat) return { kind: 'lateralidad', value: lat };
    }
    return defaultValorState(campo);
  }

  if ((campo.opciones?.length ?? 0) > 0) {
    if (state.kind === 'opcion') return state;
    return defaultValorState(campo);
  }

  return state;
}

export function defaultValorState(campo: EvaluacionCampoResponse): ValorFormState {
  switch (campo.tipo_valor) {
    case 'LATERALIDAD':
      return { kind: 'lateralidad', value: '' };
    case 'BOOLEAN':
      return { kind: 'boolean', value: null };
    case 'NUMERICO':
    case 'LSI':
      return { kind: 'numerico', value: '' };
    case 'FECHA':
      return { kind: 'fecha', value: '' };
    case 'TEXTO':
      return { kind: 'texto', value: '' };
    default:
      if ((campo.opciones?.length ?? 0) > 0) return { kind: 'opcion', value: '' };
      return { kind: 'texto', value: '' };
  }
}

export function valoresFromRegistro(
  campos: EvaluacionCampoResponse[],
  registro: EvaluacionRegistroResponse
): PruebaFormValues {
  const byCampo = new Map(registro.valores.map((v) => [v.id_campo, v]));
  const values: PruebaFormValues = {};
  for (const campo of flattenCamposParaValidacion(campos)) {
    const v = byCampo.get(campo.id);
    values[campo.id] = valorStateFromResponse(campo, v);
  }
  return values;
}

function valorStateFromResponse(
  campo: EvaluacionCampoResponse,
  v: EvaluacionValorResponse | undefined
): ValorFormState {
  if (!v) return defaultValorState(campo);
  switch (campo.tipo_valor) {
    case 'LATERALIDAD': {
      if (v.valor_lateralidad) return { kind: 'lateralidad', value: v.valor_lateralidad };
      if (v.id_opcion && (campo.opciones?.length ?? 0) > 0) {
        const opt = campo.opciones!.find((o) => o.id === v.id_opcion);
        const lat = opt
          ? normalizeLateralidadValue(opt.valor) ?? normalizeLateralidadValue(opt.etiqueta)
          : null;
        if (lat) return { kind: 'lateralidad', value: lat };
      }
      return { kind: 'lateralidad', value: '' };
    }
    case 'BOOLEAN':
      return { kind: 'boolean', value: v.valor_boolean ?? null };
    case 'NUMERICO':
    case 'LSI':
      return { kind: 'numerico', value: v.valor_numerico ?? '' };
    case 'FECHA':
      return { kind: 'fecha', value: v.valor_fecha ?? '' };
    case 'TEXTO':
      return { kind: 'texto', value: v.valor_texto ?? '' };
    default:
      if (v.id_opcion) return { kind: 'opcion', value: v.id_opcion };
      return defaultValorState(campo);
  }
}

export function formatValorForDisplay(
  tipo: TipoValorEvaluacion | null | undefined,
  v: EvaluacionValorResponse,
  opciones?: { id: string; etiqueta: string }[]
): string {
  const effectiveTipo = tipo ?? v.tipo_valor ?? undefined;

  if (v.id_opcion && opciones) {
    const opt = opciones.find((o) => o.id === v.id_opcion);
    if (opt) return opt.etiqueta;
  }
  if (v.id_opcion && !opciones) return v.id_opcion;
  if (v.valor_lateralidad) {
    return LATERALIDAD_LABELS[v.valor_lateralidad] ?? v.valor_lateralidad;
  }
  if (v.valor_boolean != null) return v.valor_boolean ? 'Sí' : 'No';
  if (effectiveTipo === 'LSI' && v.valor_numerico != null && v.valor_numerico !== '') {
    return formatLsiRatio(Number(v.valor_numerico));
  }
  if (v.valor_numerico != null && v.valor_numerico !== '') {
    return formatNumericForDisplay(v.valor_numerico);
  }
  if (v.valor_fecha) return v.valor_fecha;
  if (v.valor_texto) return v.valor_texto;
  return '—';
}

export function formatCampoValorForDetalle(
  campo: EvaluacionCampoResponse,
  v: EvaluacionValorResponse | undefined,
  campos: EvaluacionCampoResponse[],
  registro?: EvaluacionRegistroResponse
): string {
  if (campo.tipo_valor === 'LSI') {
    if (registro) {
      const computed = computeLsiFromRegistro(campos, campo, registro);
      if (computed != null) return formatLsiRatio(computed);
    }
    if (v?.valor_numerico != null && v.valor_numerico !== '') {
      return formatLsiRatio(Number(v.valor_numerico));
    }
    return '—';
  }
  if (!v) return '—';
  return formatValorForDisplay(
    campo.tipo_valor,
    v,
    campo.opciones?.map((o) => ({ id: o.id, etiqueta: o.etiqueta || o.valor }))
  );
}

export function formatRegistroResumen(r: EvaluacionRegistroResumenResponse): string {
  const prueba = r.nombre_prueba ?? r.codigo_prueba ?? 'Prueba';
  return `${prueba} · ${r.fecha_evaluacion}`;
}
