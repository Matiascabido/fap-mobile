import { apiFetch } from './http';

export const usersService = {
  async invitacionProfesional(data: { ttl_horas?: number } = {}): Promise<{ signup_url: string }> {
    return apiFetch<{ signup_url: string }>('/usuarios/invitaciones/registro-profesional', {
      method: 'POST',
      data: { ...data, ttl_horas: data.ttl_horas ?? 72 },
    });
  },
};
