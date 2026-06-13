import { apiFetch, ApiFetchContext } from './http';
import { TurnoResponse, ListTurnosParams } from '../../types/turnero.types';

function buildListQuery(
  page = 1,
  limit = 200,
  extra?: Record<string, string | undefined>
): string {
  const skip = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== '') params.append(k, v);
    }
  }
  return params.toString();
}

export const turneroService = {
  /**
   * Lista turnos en un rango de fechas
   */
  async list(params?: ListTurnosParams): Promise<TurnoResponse[]> {
    const q = buildListQuery(params?.page ?? 1, params?.limit ?? 200, {
      desde: params?.desde ?? undefined,
      hasta: params?.hasta ?? undefined,
      email_socio: params?.email_socio ?? undefined,
      email_profesional: params?.email_profesional ?? undefined,
    });
    const data = await apiFetch<TurnoResponse[]>(`/turnos?${q}`, { method: 'GET' });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene un turno por ID (incluye inscriptos)
   */
  async getById(idTurno: string): Promise<TurnoResponse> {
    return apiFetch<TurnoResponse>(`/turnos/${encodeURIComponent(idTurno)}`, {
      method: 'GET',
    });
  },

  /**
   * Inscribe al usuario actual en un turno
   */
  async inscribir(idTurno: string, ctx?: ApiFetchContext): Promise<unknown> {
    return apiFetch(
      `/turnos/${encodeURIComponent(idTurno)}/inscripcion`,
      { method: 'POST' },
      ctx
    );
  },

  /**
   * Desinscribe al usuario actual de un turno
   */
  async desinscribir(idTurno: string, ctx?: ApiFetchContext): Promise<void> {
    return apiFetch(
      `/turnos/${encodeURIComponent(idTurno)}/inscripcion`,
      { method: 'DELETE' },
      ctx
    );
  },
};
