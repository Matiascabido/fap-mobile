import { storage } from '../../services/api/storage';
import type { EvaluacionRegistroResumen } from '../../types/evaluaciones.types';

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

export function registroTimestamp(r: EvaluacionRegistroResumen): number {
  const raw = r.fecha_evaluacion || r.created_date || '';
  const t = new Date(raw.replace(/-/g, '/')).getTime();
  return Number.isNaN(t) ? 0 : t;
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
