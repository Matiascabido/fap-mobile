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

export const suscripcionDetalleService = {
  async getAll(skip = 0, limit = 100): Promise<SuscripcionDetalle[]> {
    const data = await apiFetch<SuscripcionDetalle[] | { items?: SuscripcionDetalle[] }>(
      `/suscripcion-detalles?skip=${skip}&limit=${limit}`
    );
    if (Array.isArray(data)) return data;
    return (data as any).items ?? [];
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
