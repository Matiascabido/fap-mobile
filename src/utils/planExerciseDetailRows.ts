/** Filas de detalle de ejercicio (misma lógica que el front web). */

const EXERCISE_DETAIL_ROWS: { keys: string[]; label: string }[] = [
  { keys: ['descripcion'], label: 'Descripción' },
  { keys: ['peso', 'peso_kg', 'kilos', 'carga'], label: 'Peso' },
  {
    keys: ['serie', 'series', 'cantidad_series', 'nro_series', 'num_series', 'n_series'],
    label: 'Series',
  },
  {
    keys: ['repeticion', 'reps', 'repeticiones', 'cantidad_repeticiones', 'num_reps', 'rep'],
    label: 'Repeticiones',
  },
  { keys: ['pausa_desde'], label: 'Pausa desde' },
  { keys: ['pausa_hasta'], label: 'Pausa hasta' },
  { keys: ['descanso', 'descanso_seg', 'tiempo_descanso', 'rest'], label: 'Descanso' },
  { keys: ['tiempo', 'duracion', 'duracion_seg', 'time'], label: 'Tiempo' },
  { keys: ['velocidad', 'tempo'], label: 'Tempo / velocidad' },
  { keys: ['rpe'], label: 'RPE' },
  { keys: ['rir'], label: 'RIR' },
  { keys: ['ce'], label: 'C.E.' },
  { keys: ['notas', 'nota', 'instrucciones'], label: 'Notas' },
  { keys: ['observaciones'], label: 'Observaciones' },
  { keys: ['objetivo', 'objetivo_ejercicio', 'objetivo_plan'], label: 'Objetivo (ejercicio)' },
  { keys: ['alcance', 'alcance_ejercicio', 'alcance_plan'], label: 'Alcance' },
];

const DISPLAY_KEYS_SKIP = new Set([
  'nombre',
  'nombre_ejercicio',
  'titulo',
  'id',
  'id_ejercicio',
  'id_rutina',
  'id_video',
  'video_id',
  'orden',
  'orden_ejercicio',
  'created_date',
  'update_date',
  'ejercicio',
  'video',
  'url_youtube',
  'youtube_url',
]);

function formatValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function shouldShowObservaciones(raw: unknown): boolean {
  if (typeof raw !== 'string') return true;
  const t = raw.trim();
  if (!t) return false;
  if (/^\[seed:/i.test(t)) return false;
  return true;
}

function pickExerciseDetailRows(display: Record<string, unknown>): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const row of EXERCISE_DETAIL_ROWS) {
    let raw: unknown;
    for (const k of row.keys) {
      if (k in display && display[k] !== undefined && display[k] !== null && display[k] !== '') {
        raw = display[k];
        break;
      }
    }
    if (raw === undefined) continue;
    if (row.keys.includes('observaciones') && !shouldShowObservaciones(raw)) continue;
    const str = formatValue(raw);
    if (str === '—') continue;
    out.push({ label: row.label, value: str });
  }
  return out;
}

function mergeExtraExerciseFields(
  display: Record<string, unknown>,
  existing: { label: string; value: string }[]
): { label: string; value: string }[] {
  const mappedKeys = new Set<string>();
  for (const row of EXERCISE_DETAIL_ROWS) {
    for (const k of row.keys) mappedKeys.add(k);
  }
  const usedLabels = new Set(existing.map((r) => r.label.toLowerCase()));
  const extra: { label: string; value: string }[] = [];
  for (const [k, v] of Object.entries(display)) {
    if (DISPLAY_KEYS_SKIP.has(k) || k.startsWith('id_') || mappedKeys.has(k)) continue;
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object') continue;
    const str = formatValue(v);
    if (str === '—') continue;
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (usedLabels.has(label.toLowerCase())) continue;
    usedLabels.add(label.toLowerCase());
    extra.push({ label, value: str });
  }
  return [...existing, ...extra];
}

export function exerciseRowsForDisplay(
  display: Record<string, unknown>
): { label: string; value: string }[] {
  return mergeExtraExerciseFields(display, pickExerciseDetailRows(display));
}

const PRESCRIPTION_LABELS = new Set([
  'Series',
  'Repeticiones',
  'Peso',
  'RPE',
  'RIR',
  'C.E.',
  'Pausa desde',
  'Pausa hasta',
  'Descanso',
  'Tiempo',
  'Tempo / velocidad',
]);

export function prescriptionRowsForDisplay(
  display: Record<string, unknown>
): { label: string; value: string }[] {
  return exerciseRowsForDisplay(display).filter((r) => PRESCRIPTION_LABELS.has(r.label));
}

export function otherDetailRowsForDisplay(
  display: Record<string, unknown>
): { label: string; value: string }[] {
  return exerciseRowsForDisplay(display).filter(
    (r) => r.label !== 'Descripción' && !PRESCRIPTION_LABELS.has(r.label)
  );
}

export function compactStatsFromDisplay(display: Record<string, unknown>): string {
  return prescriptionRowsForDisplay(display)
    .slice(0, 4)
    .map((r) => `${r.label} ${r.value}`)
    .join(' · ');
}
