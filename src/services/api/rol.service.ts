import { apiFetch } from './http';

export interface RolData {
  nombre_rol: string;
  observacion?: string | null;
  id_rol: string;
}

export const rolService = {
  async getAllRoles(): Promise<RolData[]> {
    const data = await apiFetch<RolData[] | { items?: RolData[] }>('/roles?skip=0&limit=100');
    return Array.isArray(data) ? data : (data.items ?? []);
  },
};
