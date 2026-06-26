import { apiFetch } from './http';
import {
  SuscripcionData,
  SuscripcionParticipante,
  SuscripcionEstado,
} from '../../types/suscripciones.types';
import {
  calcularEstadoSuscripcion as estadoDesdeFecha,
  diasHastaVencimiento as diasDesdeFecha,
} from '../../utils/fechasAlertas';
import { fechaVencimientoSuscripcion } from '../../utils/suscripcionFecha';

/** Normaliza respuestas del API: array, objeto único o envelope paginado. */
export function normalizeSuscripcionesList(raw: unknown): SuscripcionData[] {
  if (Array.isArray(raw)) return raw as SuscripcionData[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as SuscripcionData[];
    if (Array.isArray(o.data)) return o.data as SuscripcionData[];
    if (typeof o.id === 'string') return [raw as SuscripcionData];
  }
  return [];
}

export function suscripcionSocio(s: SuscripcionData): SuscripcionParticipante {
  return s.usuario_socio ?? s.socio ?? s.usuario;
}

export function suscripcionProfesional(
  s: SuscripcionData
): SuscripcionParticipante | null {
  return s.usuario_profesional ?? s.profesional ?? null;
}

export function nombreParticipante(p?: SuscripcionParticipante | null): string {
  if (!p) return '—';
  const t = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
  return t || '—';
}

export function calcularEstadoSuscripcion(s: SuscripcionData): SuscripcionEstado {
  return estadoDesdeFecha(fechaVencimientoSuscripcion(s));
}

export function diasHastaVencimiento(s: SuscripcionData): number {
  const dias = diasDesdeFecha(fechaVencimientoSuscripcion(s));
  return dias ?? 0;
}

export interface CreateSuscripcionDTO {
  id_usuario: string;
  id_suscripcion_detalle: string;
  fecha_vencimiento: string;
  id_usuario_profesional: string;
}

export const suscripcionesService = {
  async getAll(opts?: { limit?: number }): Promise<SuscripcionData[]> {
    const params = new URLSearchParams();
    params.append('skip', '0');
    params.append('limit', String(Math.min(500, Math.max(1, opts?.limit ?? 100))));
    const data = await apiFetch<unknown>(`/suscripciones?${params.toString()}`, {
      method: 'GET',
    });
    return normalizeSuscripcionesList(data);
  },

  async search(search: string): Promise<SuscripcionData[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.append('search', search.trim());
    params.append('skip', '0');
    params.append('limit', '100');
    const data = await apiFetch<unknown>(`/suscripciones?${params.toString()}`, {
      method: 'GET',
    });
    return normalizeSuscripcionesList(data);
  },

  async getById(id: string): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>(`/suscripciones/${id}`, { method: 'GET' });
  },

  async getByUsuario(usuarioId: string): Promise<SuscripcionData[]> {
    const data = await apiFetch<unknown>(
      `/suscripciones/usuario/${encodeURIComponent(usuarioId)}`,
      { method: 'GET' }
    );
    return normalizeSuscripcionesList(data);
  },

  async create(dto: CreateSuscripcionDTO): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>('/suscripciones', {
      method: 'POST',
      data: dto,
    });
  },

  async update(id: string, dto: Partial<CreateSuscripcionDTO>): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>(`/suscripciones/${id}`, {
      method: 'PATCH',
      data: dto,
    });
  },

  async getByProfesional(profesionalId: string): Promise<SuscripcionData[]> {
    const data = await apiFetch<unknown>(
      `/suscripciones?id_usuario_profesional=${encodeURIComponent(profesionalId)}&skip=0&limit=200`,
      { method: 'GET' }
    );
    return normalizeSuscripcionesList(data);
  },

  async delete(id: string): Promise<any> {
    return apiFetch(`/suscripciones/${id}`, { method: 'DELETE' });
  },
};
