/** Arma el cuerpo POST `/ejercicios` desde un ítem de `GET /ejercicios-modelo`. */

export interface EjercicioModeloItem {
  id: string;
  nombre?: string | null;
  descripcion?: string | null;
  peso?: string | null;
  serie?: string | null;
  repeticion?: string | null;
  pausa_desde?: string | null;
  pausa_hasta?: string | null;
  rpe?: string | null;
  rir?: string | null;
  ce?: string | null;
  id_video?: string | null;
}

export interface CreateEjercicioDTO {
  nombre: string;
  descripcion?: string | null;
  peso?: string | null;
  serie?: string | null;
  repeticion?: string | null;
  pausa_desde?: string | null;
  pausa_hasta?: string | null;
  rpe?: string | null;
  rir?: string | null;
  ce?: string | null;
  observaciones?: string | null;
  id_video?: string | null;
  id_ejercicio_modelo?: string | null;
}

const FIELD_MAX = 100;

function strOrNull(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  return t.slice(0, FIELD_MAX);
}

function strFromUnknown(v: unknown): string | null {
  if (typeof v === 'string') return strOrNull(v);
  if (typeof v === 'number' && Number.isFinite(v)) return String(v).slice(0, FIELD_MAX);
  return null;
}

export function buildCreateFromEjercicioModelo(
  modelo: EjercicioModeloItem,
  opts: {
    serie?: string;
    repeticion?: string;
    peso?: string;
    observaciones?: string;
    descripcion?: string;
    rpe?: string;
    rir?: string;
    ce?: string;
    pausa_desde?: string;
    pausa_hasta?: string;
  }
): CreateEjercicioDTO {
  const nombre =
    typeof modelo.nombre === 'string' && modelo.nombre.trim()
      ? modelo.nombre.trim()
      : 'Ejercicio';

  const idVideoRaw = modelo.id_video;
  const id_video =
    typeof idVideoRaw === 'string' && idVideoRaw.trim() ? idVideoRaw.trim() : null;

  const userDesc = opts.descripcion?.trim();
  const desc =
    userDesc !== undefined && userDesc !== ''
      ? userDesc
      : typeof modelo.descripcion === 'string' && modelo.descripcion.trim()
        ? modelo.descripcion.trim()
        : null;

  const rpeOpt = opts.rpe !== undefined ? strOrNull(opts.rpe) : undefined;
  const rirOpt = opts.rir !== undefined ? strOrNull(opts.rir) : undefined;
  const ceIn = opts.ce?.trim();
  const ceOpt = opts.ce !== undefined ? (ceIn ? ceIn : null) : undefined;
  const pausaDesdeOpt =
    opts.pausa_desde !== undefined ? strOrNull(opts.pausa_desde) : undefined;
  const pausaHastaOpt =
    opts.pausa_hasta !== undefined ? strOrNull(opts.pausa_hasta) : undefined;

  return {
    nombre,
    id_ejercicio_modelo: modelo.id,
    descripcion: desc,
    observaciones: opts.observaciones?.trim() || null,
    peso: strOrNull(opts.peso) ?? strFromUnknown(modelo.peso),
    serie:
      opts.serie?.trim() ||
      (typeof modelo.serie === 'string' && modelo.serie.trim() ? modelo.serie.trim() : null),
    repeticion:
      opts.repeticion?.trim() ||
      (typeof modelo.repeticion === 'string' && modelo.repeticion.trim()
        ? modelo.repeticion.trim()
        : null),
    pausa_desde: pausaDesdeOpt !== undefined ? pausaDesdeOpt : strFromUnknown(modelo.pausa_desde),
    pausa_hasta: pausaHastaOpt !== undefined ? pausaHastaOpt : strFromUnknown(modelo.pausa_hasta),
    rpe: rpeOpt !== undefined ? rpeOpt : strFromUnknown(modelo.rpe),
    rir: rirOpt !== undefined ? rirOpt : strFromUnknown(modelo.rir),
    ce: ceOpt !== undefined ? ceOpt : typeof modelo.ce === 'string' && modelo.ce.trim() ? modelo.ce.trim() : null,
    id_video,
  };
}

export function ejercicioIdFromCreateResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id ?? o.id_ejercicio;
  if (id == null) return null;
  const s = String(id).trim();
  return s || null;
}
