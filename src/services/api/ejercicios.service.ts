import { apiFetch } from './http';

export interface EjercicioCatalogo {
  id: string;
  nombre: string;
  descripcion?: string | null;
  serie?: string | null;
  repeticion?: string | null;
  peso?: string | null;
}

function normalizeEjercicio(raw: Record<string, unknown>): EjercicioCatalogo | null {
  const id = String(raw.id ?? raw.id_ejercicio ?? '').trim();
  if (!id) return null;
  return {
    id,
    nombre: String(raw.nombre ?? 'Ejercicio'),
    descripcion: raw.descripcion as string | null | undefined,
    serie: raw.serie as string | null | undefined,
    repeticion: raw.repeticion as string | null | undefined,
    peso: raw.peso as string | null | undefined,
  };
}

export const ejerciciosService = {
  async getAll(skip = 0, limit = 200): Promise<EjercicioCatalogo[]> {
    const data = await apiFetch<unknown>(`/ejercicios?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    const rows = Array.isArray(data)
      ? data
      : (data as { items?: unknown[] })?.items ?? [];
    return rows
      .map((row) =>
        normalizeEjercicio(typeof row === 'object' && row ? (row as Record<string, unknown>) : {})
      )
      .filter((e): e is EjercicioCatalogo => e != null);
  },
};
