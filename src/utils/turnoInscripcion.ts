import { storage } from '../services/api/storage';
import { TurnoResponse } from '../types/turnero.types';

const LS_TURNO_INSC = 'fap_turnero_insc';

const inscripcionesLocales = new Set<string>();

function normalizeEmail(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

function idCoincideConUsuario(item: unknown, idUsuarioActual: string): boolean {
  const uid = idUsuarioActual.trim();
  if (!uid) return false;
  if (typeof item === 'string') return item.trim() === uid;
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  const candidatos = [
    o.id_usuario,
    o.id,
    o.usuario_id,
    (o.usuario as Record<string, unknown> | null | undefined)?.id_usuario,
    (o.usuario as Record<string, unknown> | null | undefined)?.id,
  ];
  return candidatos.some((x) => x != null && String(x).trim() === uid);
}

function emailCoincideConUsuario(item: unknown, emailUsuarioActual: string): boolean {
  const want = normalizeEmail(emailUsuarioActual);
  if (!want) return false;
  if (typeof item === 'string') return normalizeEmail(item) === want;
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  const candidatos = [
    o.email,
    o.mail,
    (o.usuario as Record<string, unknown> | null | undefined)?.email,
    (o.usuario as Record<string, unknown> | null | undefined)?.mail,
  ];
  return candidatos.some((x) => x != null && normalizeEmail(String(x)) === want);
}

/**
 * Indica si el usuario autenticado está inscripto según el cuerpo del turno.
 * Prioridad: flags booleanos → arreglo inscriptos → resto de booleans en el objeto.
 */
export function inscripcionUsuarioDesdeTurnoResponse(
  t: TurnoResponse,
  idUsuarioActual?: string | null,
  emailUsuarioActual?: string | null
): boolean | null {
  const o = t as unknown as Record<string, unknown>;
  const explicit = [
    'inscripto',
    'esta_inscripto',
    'usuario_inscripto',
    'yo_inscripto',
    'inscripcion_activa',
    'tiene_inscripcion',
    'is_inscripto',
    'estaInscripto',
    'usuarioInscripto',
    'yoInscripto',
  ];
  for (const k of explicit) {
    if (!(k in o)) continue;
    const v = o[k];
    if (v === true) return true;
    if (v === false) return false;
  }

  const lista = t.inscriptos;
  const uid = idUsuarioActual?.trim() ?? '';
  const emailSesion = emailUsuarioActual?.trim() ?? '';
  if (Array.isArray(lista) && (uid || emailSesion)) {
    return lista.some(
      (item) =>
        (uid ? idCoincideConUsuario(item, uid) : false) ||
        (emailSesion ? emailCoincideConUsuario(item, emailSesion) : false)
    );
  }

  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== 'boolean') continue;
    const kl = k.toLowerCase();
    if (!kl.includes('inscript')) continue;
    if (kl.includes('cantidad')) continue;
    if (v === true) return true;
    if (v === false) return false;
  }
  return null;
}

function lsKey(userId: string): string {
  return userId ? `${LS_TURNO_INSC}:${userId}` : `${LS_TURNO_INSC}:anon`;
}

export async function hydrateTurnoInscripciones(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const raw = await storage.get(lsKey(userId));
    if (!raw) return;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return;
    for (const x of arr) {
      if (typeof x === 'string' && x.trim()) inscripcionesLocales.add(x.trim());
    }
  } catch {
    /* ignore */
  }
}

async function persistInscripciones(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await storage.set(lsKey(userId), JSON.stringify([...inscripcionesLocales]));
  } catch {
    /* ignore */
  }
}

export function estaInscriptoEnTurno(
  turno: TurnoResponse,
  userId?: string | null,
  userEmail?: string | null
): boolean {
  const desdeApi = inscripcionUsuarioDesdeTurnoResponse(turno, userId, userEmail);
  if (desdeApi === true) inscripcionesLocales.add(turno.id_turno);
  else if (desdeApi === false) inscripcionesLocales.delete(turno.id_turno);
  return desdeApi !== null ? desdeApi : inscripcionesLocales.has(turno.id_turno);
}

export async function syncTurnoInscripcionesFromList(
  turnos: TurnoResponse[],
  userId?: string | null,
  userEmail?: string | null
): Promise<void> {
  if (userId) await hydrateTurnoInscripciones(userId);
  for (const t of turnos) {
    estaInscriptoEnTurno(t, userId, userEmail);
  }
  if (userId) await persistInscripciones(userId);
}

export function marcarInscriptoLocal(idTurno: string, inscripto: boolean): void {
  if (inscripto) inscripcionesLocales.add(idTurno);
  else inscripcionesLocales.delete(idTurno);
}

export async function persistirInscripcionLocal(userId: string): Promise<void> {
  await persistInscripciones(userId);
}

export function mensajeEsDuplicadoInscripcion(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    (m.includes('ya ') && m.includes('inscript')) ||
    m.includes('ya está inscrit') ||
    m.includes('ya estas inscrit') ||
    m.includes('already') ||
    m.includes('duplicad')
  );
}

export function mensajeEsNoEstaInscripto(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    (m.includes('no ') && m.includes('inscript')) ||
    m.includes('not enrolled') ||
    m.includes('no inscrit')
  );
}
