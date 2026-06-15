import { apiFetch } from './http';

export type MedioPago = 'TRANSFERENCIA' | 'EFECTIVO' | 'TARJETA' | 'MERCADOPAGO' | 'OTRO';

export interface PagoCobranza {
  id: string;
  id_usuario_socio: string;
  id_usuario_profesional?: string;
  id_suscripcion?: string;
  monto: number;
  moneda?: string;
  es_pago_completo?: boolean;
  medio_pago: MedioPago;
  periodo_referencia?: string;
  nota?: string;
  fecha_pago: string;
  socio?: { nombre?: string; apellido?: string; mail?: string };
  profesional?: { nombre?: string; apellido?: string; mail?: string };
}

export interface CreatePagoDTO {
  id_usuario_socio: string;
  id_usuario_profesional?: string;
  id_suscripcion?: string;
  monto: number;
  moneda?: string;
  es_pago_completo?: boolean;
  medio_pago: MedioPago;
  periodo_referencia?: string;
  nota?: string;
  fecha_pago: string;
}

export interface PagosListParams {
  skip?: number;
  limit?: number;
  id_usuario_socio?: string;
  id_usuario_profesional?: string;
  mes?: string;
}

export interface ResumenMes {
  total_cobrado?: number;
  total_pendiente?: number;
  cantidad_pagos?: number;
  mes?: string;
}

export const pagosCobranzasService = {
  async getAll(params?: PagosListParams): Promise<PagoCobranza[]> {
    const p = new URLSearchParams();
    p.append('skip', String(params?.skip ?? 0));
    p.append('limit', String(params?.limit ?? 100));
    if (params?.id_usuario_socio) p.append('id_usuario_socio', params.id_usuario_socio);
    if (params?.id_usuario_profesional)
      p.append('id_usuario_profesional', params.id_usuario_profesional);

    const data = await apiFetch<PagoCobranza[] | { items?: PagoCobranza[] }>(
      `/pagos-cobranzas?${p.toString()}`
    );
    if (Array.isArray(data)) return data;
    return (data as any).items ?? [];
  },

  async getById(id: string): Promise<PagoCobranza> {
    return apiFetch<PagoCobranza>(`/pagos-cobranzas/${id}`);
  },

  async create(dto: CreatePagoDTO): Promise<PagoCobranza> {
    return apiFetch<PagoCobranza>('/pagos-cobranzas', {
      method: 'POST',
      data: dto,
    });
  },

  async update(id: string, dto: Partial<CreatePagoDTO>): Promise<PagoCobranza> {
    return apiFetch<PagoCobranza>(`/pagos-cobranzas/${id}`, {
      method: 'PATCH',
      data: dto,
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/pagos-cobranzas/${id}`, { method: 'DELETE' });
  },

  async getResumenMes(mes: string, idProfesional?: string): Promise<ResumenMes> {
    const p = new URLSearchParams({ mes });
    if (idProfesional) p.append('id_usuario_profesional', idProfesional);
    return apiFetch<ResumenMes>(`/pagos-cobranzas/resumen?${p.toString()}`, {}, {
      suppressGlobalAlert: true,
    });
  },
};
