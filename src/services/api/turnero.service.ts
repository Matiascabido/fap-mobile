import { apiFetch, ApiFetchContext, HttpRequestError } from './http';
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

function normalizeTurnosList(raw: unknown): TurnoResponse[] {
  if (Array.isArray(raw)) return raw as TurnoResponse[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as TurnoResponse[];
    if (Array.isArray(o.data)) return o.data as TurnoResponse[];
    if (Array.isArray(o.turnos)) return o.turnos as TurnoResponse[];
  }
  return [];
}

export interface TurnoCreateDTO {
  titulo: string;
  cupos_maximos: number;
  fecha_hora_inicio: string;
  duracion_minutos: number;
  descripcion?: string | null;
}

export const turneroService = {
  async list(params?: ListTurnosParams): Promise<TurnoResponse[]> {
    const extra: Record<string, string | undefined> = {
      desde: params?.desde ?? undefined,
      hasta: params?.hasta ?? undefined,
      email_socio: params?.email_socio ?? undefined,
      email_profesional: params?.email_profesional ?? undefined,
    };
    const ctx: ApiFetchContext = { suppressGlobalAlert: true };

    const fetchPage = async (queryExtra: Record<string, string | undefined>) => {
      const q = buildListQuery(params?.page ?? 1, params?.limit ?? 200, queryExtra);
      return apiFetch<unknown>(`/turnos?${q}`, { method: 'GET' }, ctx);
    };

    try {
      const data = await fetchPage(extra);
      return normalizeTurnosList(data);
    } catch (error) {
      // Backend falla al comparar `desde` pasado con `hoy` (naive vs aware).
      if (error instanceof HttpRequestError && error.status >= 500 && extra.desde) {
        const { desde: _omit, ...withoutDesde } = extra;
        const data = await fetchPage(withoutDesde);
        return normalizeTurnosList(data);
      }
      throw error;
    }
  },

  async create(dto: TurnoCreateDTO): Promise<TurnoResponse[]> {
    const data = await apiFetch<unknown>('/turnos', { method: 'POST', data: dto });
    return normalizeTurnosList(data);
  },

  async getById(idTurno: string): Promise<TurnoResponse> {
    return apiFetch<TurnoResponse>(`/turnos/${encodeURIComponent(idTurno)}`, {
      method: 'GET',
    });
  },

  async inscribir(idTurno: string, ctx?: ApiFetchContext): Promise<unknown> {
    return apiFetch(
      `/turnos/${encodeURIComponent(idTurno)}/inscripcion`,
      { method: 'POST' },
      ctx
    );
  },

  async desinscribir(idTurno: string, ctx?: ApiFetchContext): Promise<void> {
    return apiFetch(
      `/turnos/${encodeURIComponent(idTurno)}/inscripcion`,
      { method: 'DELETE' },
      ctx
    );
  },
};
