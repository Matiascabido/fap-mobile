import { apiFetch } from './http';
import {
  User,
  Socio,
  SocioDetail,
  CreateSocioDTO,
} from '../../types/socios.types';

function buildUsuariosListParams(extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  params.append('skip', '0');
  params.append('limit', '500');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      params.append(k, v);
    }
  }
  return params.toString();
}

/**
 * Mapea un User del backend al Socio normalizado para la UI
 */
export function mapUserToSocio(u: User): Socio | null {
  const id = String(u.id_usuario ?? u.id ?? '').trim();
  if (!id) return null;
  const tipoEstatus = (u.tipo_estatus || u.tipo_status || '').trim();
  const rolNombre = u.rol?.nombre_rol ?? 'usuario';

  return {
    id,
    nombre: `${u.nombre} ${u.apellido}`,
    dni: u.dni,
    email: u.mail ?? '',
    telefono: u.celular ?? '',
    tipo: rolNombre.toLowerCase(),
    estado: u.estado ? 'Activo' : 'Inactivo',
    ...(tipoEstatus ? { tipoEstatus } : {}),
  };
}

export const sociosService = {
  /**
   * Obtiene la lista completa de usuarios y la mapea a Socios
   */
  async getAll(search?: string): Promise<Socio[]> {
    const params = buildUsuariosListParams(
      search?.trim() ? { search: search.trim() } : undefined
    );
    const data = await apiFetch<User[]>(`/usuarios?${params}`, {
      method: 'GET',
    });
    const users = Array.isArray(data) ? data : [];
    return users.map(mapUserToSocio).filter((s): s is Socio => s != null);
  },

  /**
   * Obtiene id_rol por defecto para alta de socio
   */
  async getDefaultSocioRolId(): Promise<string> {
    const params = buildUsuariosListParams({ socios: 'true' });
    const data = await apiFetch<User[]>(`/usuarios?${params}`, { method: 'GET' });
    const users = Array.isArray(data) ? data : [];
    for (const u of users) {
      if (u.rol?.id_rol) return u.rol.id_rol;
    }
    throw new Error('No se pudo determinar el rol para crear socios');
  },

  /**
   * Obtiene solo socios/entrenados (combo de suscripciones)
   */
  async getSocios(): Promise<Socio[]> {
    const params = buildUsuariosListParams({ socios: 'true' });
    const data = await apiFetch<User[]>(`/usuarios?${params}`, {
      method: 'GET',
    });
    const users = Array.isArray(data) ? data : [];
    return users.map(mapUserToSocio).filter((s): s is Socio => s != null);
  },

  /**
   * Obtiene el detalle de un socio por ID
   */
  async getById(id: string): Promise<SocioDetail> {
    const trimmed = id.trim();
    if (!trimmed || trimmed === 'new') {
      throw new Error('ID de socio inválido');
    }
    return await apiFetch<SocioDetail>(`/usuarios/${encodeURIComponent(trimmed)}`, {
      method: 'GET',
    });
  },

  /**
   * Crea un nuevo socio
   */
  async create(data: CreateSocioDTO): Promise<any> {
    return await apiFetch('/usuarios/socio', {
      method: 'POST',
      data,
    });
  },

  /**
   * Actualiza un socio existente
   */
  async update(id: string, data: Partial<CreateSocioDTO>): Promise<void> {
    return await apiFetch(`/usuarios/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  /**
   * Elimina un socio
   */
  async delete(id: string): Promise<any> {
    return await apiFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Desactiva un usuario (soft delete)
   */
  async deactivate(id: string): Promise<any> {
    return await apiFetch(`/usuarios/${encodeURIComponent(id)}/desactivar`, {
      method: 'PATCH',
    });
  },
};
