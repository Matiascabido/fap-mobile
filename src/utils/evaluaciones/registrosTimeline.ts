import { storage } from '../../services/api/storage';
import type {
  EvaluacionGrupo,
  EvaluacionRegistroResumen,
} from '../../types/evaluaciones.types';
import {
  buildRegistroInputOrder,
  compareRegistrosCronologico,
  registroInstantRaw,
  registroSortTimestamp,
} from './evalRegistroDate';
import { findGrupoForPruebaId, flattenPruebasFromGrupo } from './pruebaOrdering';

export const LAST_EVALUACION_GRUPO_KEY = 'evaluaciones_last_grupo_id';

const memory = new Map<string, string>();

function memGet(key: string): string | null {
  return memory.get(key) ?? null;
}

function memSet(key: string, value: string): void {
  memory.set(key, value);
  void storage.set(key, value);
}

function memRemove(key: string): void {
  memory.delete(key);
  void storage.remove(key);
}

export interface SesionEvaluacion {
  n: number;
  fecha: string;
  registro: EvaluacionRegistroResumen;
}

export interface HistorialPruebaEnSesion {
  pruebaId: string;
  nombre: string;
  seccionNombre: string;
  orden: number;
  registro: EvaluacionRegistroResumen;
}

export interface HistorialSesionEvaluacion {
  key: string;
  fecha: string;
  registradoAt?: string | null;
  grupo: EvaluacionGrupo | null;
  pruebas: HistorialPruebaEnSesion[];
  totalPruebasGrupo: number;
  sessionIndex: number;
}

export interface HistorialSesionNumerada extends HistorialSesionEvaluacion {
  numeroSesion: number;
  totalSesionesGrupo: number;
}

export interface HistorialGrupoEvaluacion {
  grupoId: string;
  grupo: EvaluacionGrupo | null;
  grupoNombre: string;
  sesiones: HistorialSesionNumerada[];
  primeraFecha: string;
  ultimaFecha: string;
}

export function registroTimestamp(r: EvaluacionRegistroResumen): number {
  return registroSortTimestamp(r);
}

export { compareRegistrosCronologico } from './evalRegistroDate';

const buildInputOrder = buildRegistroInputOrder;

function maxRegistradoAt(pruebas: HistorialPruebaEnSesion[]): string | null {
  let max: string | null = null;
  let maxTs = -Infinity;
  for (const p of pruebas) {
    const raw = registroInstantRaw(p.registro);
    if (!raw) continue;
    const ts = registroSortTimestamp(p.registro);
    if (Number.isFinite(ts) && ts >= maxTs) {
      maxTs = ts;
      max = raw;
    }
  }
  return max;
}

function buildPruebasEnSesion(
  byPrueba: Map<string, EvaluacionRegistroResumen>,
  grupo: EvaluacionGrupo | null
): HistorialPruebaEnSesion[] {
  const orderList = grupo ? flattenPruebasFromGrupo(grupo) : [];
  const orderMap = new Map(orderList.map((p, i) => [p.id, i]));

  return [...byPrueba.entries()]
    .map(([pruebaId, registro]) => {
      const meta = orderList.find((p) => p.id === pruebaId);
      return {
        pruebaId,
        nombre: registro.nombre_prueba ?? registro.codigo_prueba ?? 'Prueba',
        seccionNombre: meta?.seccionNombre ?? '',
        orden: orderMap.get(pruebaId) ?? 999,
        registro,
      };
    })
    .sort((a, b) => a.orden - b.orden);
}

function fechaDisplaySesion(pruebas: HistorialPruebaEnSesion[]): string {
  if (pruebas.length === 0) return '';
  let best = pruebas[0].registro.fecha_evaluacion;
  let maxTs = registroSortTimestamp(pruebas[0].registro);
  for (const p of pruebas.slice(1)) {
    const ts = registroSortTimestamp(p.registro);
    if (ts >= maxTs) {
      maxTs = ts;
      best = p.registro.fecha_evaluacion;
    }
  }
  return best;
}

export function buildHistorialSesiones(
  registros: EvaluacionRegistroResumen[],
  catalogo: EvaluacionGrupo[]
): HistorialSesionEvaluacion[] {
  const inputOrder = buildInputOrder(registros);
  const byGrupo = new Map<
    string,
    { grupo: EvaluacionGrupo | null; registros: EvaluacionRegistroResumen[] }
  >();

  for (const r of registros) {
    const grupo = findGrupoForPruebaId(catalogo, r.id_prueba);
    const grupoId = grupo?.id ?? '_sin_grupo';
    const entry = byGrupo.get(grupoId) ?? { grupo: grupo ?? null, registros: [] };
    entry.registros.push(r);
    byGrupo.set(grupoId, entry);
  }

  const allSessions: HistorialSesionEvaluacion[] = [];

  for (const [grupoId, { grupo, registros: grupoRegistros }] of byGrupo) {
    const byPrueba = new Map<string, EvaluacionRegistroResumen[]>();
    for (const r of grupoRegistros) {
      const list = byPrueba.get(r.id_prueba) ?? [];
      list.push(r);
      byPrueba.set(r.id_prueba, list);
    }

    for (const [pruebaId, list] of byPrueba) {
      byPrueba.set(
        pruebaId,
        [...list].sort((a, b) => compareRegistrosCronologico(a, b, inputOrder))
      );
    }

    let maxRondas = 0;
    for (const list of byPrueba.values()) {
      maxRondas = Math.max(maxRondas, list.length);
    }

    const orderList = grupo ? flattenPruebasFromGrupo(grupo) : [];

    for (let sessionIndex = 0; sessionIndex < maxRondas; sessionIndex += 1) {
      const bucket = new Map<string, EvaluacionRegistroResumen>();
      for (const [pruebaId, list] of byPrueba) {
        const registro = list[sessionIndex];
        if (registro) bucket.set(pruebaId, registro);
      }
      if (bucket.size === 0) continue;

      const pruebas = buildPruebasEnSesion(bucket, grupo);
      allSessions.push({
        key: `${grupoId}::${sessionIndex}`,
        fecha: fechaDisplaySesion(pruebas),
        registradoAt: maxRegistradoAt(pruebas),
        grupo,
        pruebas,
        totalPruebasGrupo: orderList.length || pruebas.length,
        sessionIndex,
      });
    }
  }

  return allSessions.sort((a, b) => {
    const gA = a.grupo?.id ?? '';
    const gB = b.grupo?.id ?? '';
    if (gA !== gB) return gB.localeCompare(gA);
    if (a.sessionIndex !== b.sessionIndex) return b.sessionIndex - a.sessionIndex;
    return registroTimestampForSesion(b) - registroTimestampForSesion(a);
  });
}

function registroTimestampForSesion(sesion: HistorialSesionEvaluacion): number {
  if (sesion.registradoAt) {
    return registroSortTimestamp({
      fecha_evaluacion: sesion.registradoAt,
      created_date: null,
    });
  }
  return registroSortTimestamp({
    fecha_evaluacion: sesion.fecha,
    created_date: null,
  });
}

export function groupHistorialByGrupo(
  sesiones: HistorialSesionEvaluacion[]
): HistorialGrupoEvaluacion[] {
  const bucket = new Map<string, HistorialSesionEvaluacion[]>();

  for (const sesion of sesiones) {
    const grupoId = sesion.grupo?.id ?? '_sin_grupo';
    const list = bucket.get(grupoId) ?? [];
    list.push(sesion);
    bucket.set(grupoId, list);
  }

  const grupos: HistorialGrupoEvaluacion[] = [];

  for (const [grupoId, list] of bucket) {
    const cronologico = [...list].sort((a, b) => a.sessionIndex - b.sessionIndex);
    const total = cronologico.length;
    const numeradas: HistorialSesionNumerada[] = cronologico.map((s, i) => ({
      ...s,
      numeroSesion: i + 1,
      totalSesionesGrupo: total,
    }));

    grupos.push({
      grupoId,
      grupo: cronologico[0]?.grupo ?? null,
      grupoNombre: cronologico[0]?.grupo?.nombre ?? 'Evaluación',
      sesiones: [...numeradas].reverse(),
      primeraFecha: cronologico[0]?.fecha ?? '',
      ultimaFecha: cronologico[total - 1]?.fecha ?? '',
    });
  }

  return grupos.sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha));
}

export function groupRegistrosByPrueba(
  registros: EvaluacionRegistroResumen[]
): Map<string, EvaluacionRegistroResumen[]> {
  const inputOrder = buildInputOrder(registros);
  const map = new Map<string, EvaluacionRegistroResumen[]>();
  for (const r of registros) {
    const list = map.get(r.id_prueba) ?? [];
    list.push(r);
    map.set(r.id_prueba, list);
  }
  for (const [key, list] of map) {
    map.set(
      key,
      [...list].sort((a, b) => compareRegistrosCronologico(a, b, inputOrder))
    );
  }
  return map;
}

export function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fechaEvaluacionHoy(): string {
  return todayYmdLocal();
}

export function draftStorageKey(
  socioId: string,
  fecha: string,
  grupoId: string,
  pruebaId: string
): string {
  return `eval_draft:${socioId}:${fecha}:${grupoId}:${pruebaId}`;
}

export function sessionStorageKey(socioId: string, fecha: string, grupoId: string): string {
  return `eval_session:${socioId}:${fecha}:${grupoId}`;
}

export interface EvaluacionSessionState {
  estados: Record<string, 'pendiente' | 'guardada' | 'omitida' | 'activa'>;
  inicioAt?: string;
}

export interface SessionProgressSummary {
  guardadas: number;
  omitidas: number;
  pendientes: number;
  total: number;
  hasProgress: boolean;
  isComplete: boolean;
}

export function readSessionState(key: string): EvaluacionSessionState | null {
  try {
    const raw = memGet(key);
    if (!raw) return null;
    return JSON.parse(raw) as EvaluacionSessionState;
  } catch {
    return null;
  }
}

export function writeSessionState(key: string, state: EvaluacionSessionState): void {
  try {
    memSet(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function summarizeSessionState(
  state: EvaluacionSessionState | null,
  pruebaIds: string[]
): SessionProgressSummary {
  const total = pruebaIds.length;
  let guardadas = 0;
  let omitidas = 0;
  let pendientes = 0;

  for (const id of pruebaIds) {
    const e = state?.estados?.[id] ?? 'pendiente';
    if (e === 'guardada') guardadas += 1;
    else if (e === 'omitida') omitidas += 1;
    else pendientes += 1;
  }

  const hasProgress = guardadas + omitidas > 0;
  const isComplete = total > 0 && guardadas + omitidas >= total;

  return { guardadas, omitidas, pendientes, total, hasProgress, isComplete };
}

export function readDraft(key: string): unknown {
  try {
    const raw = memGet(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeDraft(key: string, data: unknown): void {
  try {
    memSet(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function clearDraft(key: string): void {
  memRemove(key);
}

export function readLastGrupoId(): string {
  return memGet(LAST_EVALUACION_GRUPO_KEY) ?? '';
}

export function writeLastGrupoId(grupoId: string): void {
  memSet(LAST_EVALUACION_GRUPO_KEY, grupoId);
}

export function clearEvaluacionSessionForGrupo(
  socioId: string,
  fecha: string,
  grupoId: string,
  pruebaIds: string[]
): void {
  memRemove(sessionStorageKey(socioId, fecha, grupoId));
  for (const pruebaId of pruebaIds) {
    clearDraft(draftStorageKey(socioId, fecha, grupoId, pruebaId));
  }
}

export function clearAllEvaluacionCacheForSocio(socioId: string): void {
  if (!socioId) return;
  const prefixes = [`eval_session:${socioId}:`, `eval_draft:${socioId}:`];
  for (const key of [...memory.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) {
      memRemove(key);
    }
  }
}

export async function hydrateEvaluacionStorage(): Promise<void> {
  try {
    const last = await storage.get(LAST_EVALUACION_GRUPO_KEY);
    if (last) memory.set(LAST_EVALUACION_GRUPO_KEY, last);
  } catch {
    /* ignore */
  }
}
