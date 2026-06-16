import { apiFetch } from './http';
import type { CreateEjercicioDTO } from '../../utils/planEjercicioClone';

export interface EjercicioCatalogo {
  id: string;
  nombre: string;
  descripcion?: string | null;
  serie?: string | null;
  repeticion?: string | null;
  peso?: string | null;
  pausa_desde?: string | null;
  pausa_hasta?: string | null;
  rpe?: string | null;
  rir?: string | null;
  ce?: string | null;
  observaciones?: string | null;
  id_video?: string | null;
  url_youtube?: string | null;
  video?: Record<string, unknown> | null;
}

export interface EjercicioModelo extends EjercicioCatalogo {
  id_ejercicio_modelo?: string | null;
}

function normalizeModelo(raw: Record<string, unknown>): EjercicioModelo | null {
  const base = normalizeEjercicio(raw);
  if (!base) return null;
  return { ...base, id_ejercicio_modelo: base.id };
}

function normalizeEjercicio(raw: Record<string, unknown>): EjercicioCatalogo | null {
  const id = String(raw.id ?? raw.id_ejercicio ?? '').trim();
  if (!id) return null;
  const videoRaw = raw.video;
  return {
    id,
    nombre: String(raw.nombre ?? 'Ejercicio'),
    descripcion: raw.descripcion as string | null | undefined,
    serie: raw.serie as string | null | undefined,
    repeticion: raw.repeticion as string | null | undefined,
    peso: raw.peso as string | null | undefined,
    pausa_desde: raw.pausa_desde as string | null | undefined,
    pausa_hasta: raw.pausa_hasta as string | null | undefined,
    rpe: raw.rpe as string | null | undefined,
    rir: raw.rir as string | null | undefined,
    ce: raw.ce as string | null | undefined,
    observaciones: raw.observaciones as string | null | undefined,
    id_video: raw.id_video != null ? String(raw.id_video) : null,
    url_youtube:
      typeof raw.url_youtube === 'string'
        ? raw.url_youtube
        : typeof raw.youtube_url === 'string'
          ? raw.youtube_url
          : null,
    video: videoRaw && typeof videoRaw === 'object' ? (videoRaw as Record<string, unknown>) : null,
  };
}

export const ejerciciosService = {
  async getAll(skip = 0, limit = 200): Promise<EjercicioCatalogo[]> {
    const data = await apiFetch<unknown>(`/ejercicios?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    const rows = Array.isArray(data)
      ? data
      : (data as { items?: unknown[] })?.items ?? [];
    return rows
      .map((row) =>
        normalizeEjercicio(typeof row === 'object' && row ? (row as Record<string, unknown>) : {})
      )
      .filter((e): e is EjercicioCatalogo => e != null);
  },

  async getModelos(skip = 0, limit = 200): Promise<EjercicioModelo[]> {
    const data = await apiFetch<unknown>(`/ejercicios-modelo?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    const rows = Array.isArray(data)
      ? data
      : (data as { items?: unknown[] })?.items ?? [];
    return rows
      .map((row) =>
        normalizeModelo(typeof row === 'object' && row ? (row as Record<string, unknown>) : {})
      )
      .filter((e): e is EjercicioModelo => e != null);
  },

  async create(dto: CreateEjercicioDTO): Promise<unknown> {
    return apiFetch('/ejercicios', { method: 'POST', data: dto });
  },

  async update(
    ejercicioId: string,
    body: Partial<
      Pick<
        EjercicioCatalogo,
        | 'nombre'
        | 'descripcion'
        | 'serie'
        | 'repeticion'
        | 'peso'
        | 'pausa_desde'
        | 'pausa_hasta'
        | 'rpe'
        | 'rir'
        | 'ce'
        | 'observaciones'
      >
    >
  ): Promise<unknown> {
    return apiFetch(`/ejercicios/${encodeURIComponent(ejercicioId)}`, {
      method: 'PATCH',
      data: body,
    });
  },

  async getById(ejercicioId: string): Promise<EjercicioCatalogo | null> {
    const trimmed = ejercicioId?.trim();
    if (!trimmed) return null;
    try {
      const raw = await apiFetch<unknown>(
        `/ejercicios/${encodeURIComponent(trimmed)}`,
        { method: 'GET' },
        { suppressGlobalAlert: true }
      );
      if (raw && typeof raw === 'object') {
        return normalizeEjercicio(raw as Record<string, unknown>);
      }
    } catch {
      const list = await this.getAll(0, 500);
      return list.find((e) => e.id === trimmed) ?? null;
    }
    return null;
  },
};
