import { apiFetch } from './http';
import {
  SuscripcionData,
  SuscripcionParticipante,
  SuscripcionEstado,
} from '../../types/suscripciones.types';

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

/**
 * Calcula el estado de una suscripción según su fecha de vencimiento
 */
export function calcularEstadoSuscripcion(s: SuscripcionData): SuscripcionEstado {
  const raw = s.fecha_vencimiento?.trim();
  if (!raw) return 'vencida';
  const end = new Date(raw.replace(/-/g, '/'));
  if (Number.isNaN(end.getTime())) return 'vencida';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < today) return 'vencida';

  // Por vencer: dentro de los próximos 7 días
  const sieteDias = new Date(today);
  sieteDias.setDate(sieteDias.getDate() + 7);
  if (end <= sieteDias) return 'por_vencer';

  return 'vigente';
}

/**
 * Días restantes hasta el vencimiento (negativo si ya venció)
 */
export function diasHastaVencimiento(s: SuscripcionData): number {
  const raw = s.fecha_vencimiento?.trim();
  if (!raw) return -9999;
  const end = new Date(raw.replace(/-/g, '/'));
  if (Number.isNaN(end.getTime())) return -9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export interface CreateSuscripcionDTO {
  id_usuario: string;
  id_suscripcion_detalle: string;
  fecha_vencimiento: string;
  id_usuario_profesional: string;
}

export const suscripcionesService = {
  /**
   * Lista todas las suscripciones
   */
  async getAll(opts?: { limit?: number }): Promise<SuscripcionData[]> {
    const params = new URLSearchParams();
    params.append('skip', '0');
    params.append('limit', String(Math.min(500, Math.max(1, opts?.limit ?? 100))));
    const data = await apiFetch<SuscripcionData[]>(`/suscripciones?${params.toString()}`, {
      method: 'GET',
    });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Busca suscripciones por término
   */
  async search(search: string): Promise<SuscripcionData[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.append('search', search.trim());
    params.append('skip', '0');
    params.append('limit', '100');
    const data = await apiFetch<SuscripcionData[]>(`/suscripciones?${params.toString()}`, {
      method: 'GET',
    });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene una suscripción por ID
   */
  async getById(id: string): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>(`/suscripciones/${id}`, { method: 'GET' });
  },

  /**
   * Suscripciones de un usuario específico
   */
  async getByUsuario(usuarioId: string): Promise<SuscripcionData[]> {
    const data = await apiFetch<SuscripcionData[]>(
      `/suscripciones/usuario/${encodeURIComponent(usuarioId)}`,
      { method: 'GET' }
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Crea una nueva suscripción
   */
  async create(dto: CreateSuscripcionDTO): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>('/suscripciones', {
      method: 'POST',
      data: dto,
    });
  },

  /**
   * Actualiza una suscripción
   */
  async update(id: string, dto: Partial<CreateSuscripcionDTO>): Promise<SuscripcionData> {
    return apiFetch<SuscripcionData>(`/suscripciones/${id}`, {
      method: 'PATCH',
      data: dto,
    });
  },

  /**
   * Suscripciones por profesional
   */
  async getByProfesional(profesionalId: string): Promise<SuscripcionData[]> {
    const data = await apiFetch<SuscripcionData[]>(
      `/suscripciones?id_usuario_profesional=${encodeURIComponent(profesionalId)}&skip=0&limit=200`,
      { method: 'GET' }
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Elimina una suscripción
   */
  async delete(id: string): Promise<any> {
    return apiFetch(`/suscripciones/${id}`, { method: 'DELETE' });
  },
};
