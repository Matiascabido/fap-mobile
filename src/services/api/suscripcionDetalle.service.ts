import { apiFetch } from './http';

export interface SuscripcionDetalle {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: string | number;
  moneda?: string;
  duracion_dias?: number;
  activo?: boolean;
}

export interface CreateSuscripcionDetalleDTO {
  nombre: string;
  descripcion?: string;
  precio?: number;
  moneda?: string;
  duracion_dias?: number;
}

function normalizeDetalle(raw: Record<string, unknown>): SuscripcionDetalle {
  return {
    id: String(raw.id ?? raw.id_suscripcion_detalle ?? ''),
    nombre: String(raw.nombre ?? ''),
    descripcion: raw.descripcion as string | undefined,
    precio: raw.precio as string | number | undefined,
    moneda: raw.moneda as string | undefined,
    duracion_dias: raw.duracion_dias as number | undefined,
    activo: raw.activo as boolean | undefined,
  };
}

export const suscripcionDetalleService = {
  async getAll(skip = 0, limit = 100): Promise<SuscripcionDetalle[]> {
    const data = await apiFetch<SuscripcionDetalle[] | { items?: SuscripcionDetalle[] }>(
      `/suscripcion-detalles?skip=${skip}&limit=${limit}`
    );
    const rows: unknown[] = Array.isArray(data) ? data : (data as { items?: unknown[] }).items ?? [];
    return rows
      .map((row) =>
        normalizeDetalle(typeof row === 'object' && row ? (row as Record<string, unknown>) : {})
      )
      .filter((d: SuscripcionDetalle) => Boolean(d.id));
  },

  async create(dto: CreateSuscripcionDetalleDTO): Promise<SuscripcionDetalle> {
    return apiFetch<SuscripcionDetalle>('/suscripcion-detalles', {
      method: 'POST',
      data: dto,
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/suscripcion-detalles/${id}`, { method: 'DELETE' });
  },
};
