import { apiFetch } from './http';
import { PlanWithRelations, AsignacionPlan } from '../../types/planes.types';

function buildListQuery(page = 1, limit = 100): string {
  const skip = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  return params.toString();
}

/**
 * Normaliza el payload de la lista de planes
 */
function normalizePlanesListPayload(raw: unknown): PlanWithRelations[] {
  if (Array.isArray(raw)) {
    return raw as PlanWithRelations[];
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as PlanWithRelations[];
    if (Array.isArray(o.data)) return o.data as PlanWithRelations[];
    if (Array.isArray(o.planes)) return o.planes as PlanWithRelations[];
  }
  return [];
}

export const planesService = {
  /**
   * GET /planes - lista de planes con relaciones
   */
  async getAll(page = 1, limit = 100): Promise<PlanWithRelations[]> {
    const raw = await apiFetch<unknown>(`/planes?${buildListQuery(page, limit)}`, {
      method: 'GET',
    });
    return normalizePlanesListPayload(raw);
  },

  /**
   * Lista las asignaciones de planes de un socio específico
   */
  async getAsignacionesBySocio(socioId: string): Promise<AsignacionPlan[]> {
    const data = await apiFetch<AsignacionPlan[]>(
      `/planes/asignaciones/socio/${encodeURIComponent(socioId)}`,
      { method: 'GET' }
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene una asignación específica
   */
  async getAsignacion(asignacionId: string): Promise<AsignacionPlan> {
    return apiFetch(`/planes/asignaciones/${encodeURIComponent(asignacionId)}`, {
      method: 'GET',
    });
  },

  /**
   * Elimina un plan
   */
  async delete(planId: string): Promise<void> {
    return apiFetch(`/planes/${encodeURIComponent(planId)}`, { method: 'DELETE' });
  },
};
