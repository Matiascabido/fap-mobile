import { apiFetch } from './http';
import { PlanWithRelations, TipoPlan } from '../../types/planes.types';

function buildListQuery(page = 1, limit = 100): string {
  const skip = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  return params.toString();
}

function normalizePlanesListPayload(raw: unknown): PlanWithRelations[] {
  if (Array.isArray(raw)) return raw as PlanWithRelations[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as PlanWithRelations[];
    if (Array.isArray(o.data)) return o.data as PlanWithRelations[];
    if (Array.isArray(o.planes)) return o.planes as PlanWithRelations[];
  }
  return [];
}

export interface PlanCreateDTO {
  numero: number;
  nombre_plan: string;
  id_tipo_plan: string;
  semanas?: number | null;
  descripcion?: string | null;
  objetivo_semanal?: string | null;
  observaciones?: string | null;
}

export interface PlanUpdateDTO {
  numero?: number;
  nombre_plan?: string;
  id_tipo_plan?: string;
  semanas?: number | null;
  descripcion?: string | null;
  objetivo_semanal?: string | null;
  observaciones?: string | null;
}

export interface AgregarBloqueDTO {
  nombre?: string | null;
  color?: string | null;
  observaciones?: string | null;
  dia_semana?: number | null;
  orden?: number | null;
  id_bloque?: string | null;
  id_ejercicio?: string | null;
}

export const planesService = {
  async getAll(page = 1, limit = 100): Promise<PlanWithRelations[]> {
    const raw = await apiFetch<unknown>(`/planes?${buildListQuery(page, limit)}`, {
      method: 'GET',
    });
    return normalizePlanesListPayload(raw);
  },

  async getTipos(): Promise<TipoPlan[]> {
    const data = await apiFetch<TipoPlan[] | { items?: TipoPlan[] }>('/planes/tipos', {
      method: 'GET',
    });
    if (Array.isArray(data)) return data;
    return (data as { items?: TipoPlan[] }).items ?? [];
  },

  async create(dto: PlanCreateDTO): Promise<unknown> {
    return apiFetch('/planes', { method: 'POST', data: dto });
  },

  async update(planId: string, dto: PlanUpdateDTO): Promise<unknown> {
    return apiFetch(`/planes/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      data: dto,
    });
  },

  async addBloque(planId: string, dto: AgregarBloqueDTO): Promise<unknown> {
    return apiFetch(`/planes/${encodeURIComponent(planId)}/plan-bloques`, {
      method: 'POST',
      data: dto,
    });
  },

  async addEjercicioToBloque(
    planId: string,
    planBloqueId: string,
    idEjercicio: string
  ): Promise<unknown> {
    return apiFetch(
      `/planes/${encodeURIComponent(planId)}/plan-bloques/${encodeURIComponent(planBloqueId)}/ejercicios`,
      {
        method: 'POST',
        data: { id_ejercicio: idEjercicio },
      }
    );
  },

  async getAsignacionesBySocio(socioId: string) {
    const data = await apiFetch<unknown>(
      `/planes/asignaciones/socio/${encodeURIComponent(socioId)}`,
      { method: 'GET' }
    );
    return Array.isArray(data) ? data : [];
  },

  async getAsignacion(asignacionId: string) {
    return apiFetch(`/planes/asignaciones/${encodeURIComponent(asignacionId)}`, {
      method: 'GET',
    });
  },

  async delete(planId: string): Promise<void> {
    return apiFetch(`/planes/${encodeURIComponent(planId)}`, { method: 'DELETE' });
  },
};
