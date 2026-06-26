import api, { apiFetch, HttpRequestError, UnauthorizedSessionError } from './http';
import axios from 'axios';
import type { PerfilFotoUploadResponse } from '../../types/perfil/perfilFoto.api.types';
import { parsePerfilFotoUrl } from '../../utils/perfilFotoUpload';

export interface UsuarioPerfilData {
  foto_url?: string;
  nombre?: string;
  apellido?: string;
  mail?: string;
}

export async function getUsuarioPerfil(id: string): Promise<UsuarioPerfilData> {
  return apiFetch<UsuarioPerfilData>(`/usuarios/${encodeURIComponent(id.trim())}`, {
    method: 'GET',
  }, { suppressGlobalAlert: true });
}

export async function uploadFotoPerfil(
  id: string,
  file: { uri: string; name: string; type: string }
): Promise<{ response: PerfilFotoUploadResponse; fotoUrl?: string }> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  try {
    const { data } = await api.post<PerfilFotoUploadResponse>(
      `/usuarios/${encodeURIComponent(id.trim())}/foto-perfil`,
      form,
      { timeout: 60_000 }
    );
    const fotoUrl = parsePerfilFotoUrl(data);
    return { response: data, fotoUrl };
  } catch (error) {
    if (error instanceof UnauthorizedSessionError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const endpoint = `/usuarios/${id.trim()}/foto-perfil`;
      let message = 'No se pudo subir la foto.';
      const data = error.response?.data;
      if (typeof data === 'object' && data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === 'string' && detail.trim()) {
          message = detail.trim();
        } else if (Array.isArray(detail)) {
          const parts = detail
            .map((item) =>
              item && typeof item === 'object' && 'msg' in item
                ? String((item as { msg?: unknown }).msg ?? '')
                : typeof item === 'string'
                  ? item
                  : ''
            )
            .filter(Boolean);
          if (parts.length) message = parts.join('. ');
        } else if (typeof (data as { message?: string }).message === 'string') {
          message = (data as { message: string }).message;
        }
      }
      throw new HttpRequestError(message, status, endpoint);
    }
    throw error;
  }
}

export const usersService = {
  async invitacionProfesional(data: { ttl_horas?: number } = {}): Promise<{ signup_url: string }> {
    return apiFetch<{ signup_url: string }>('/usuarios/invitaciones/registro-profesional', {
      method: 'POST',
      data: { ...data, ttl_horas: data.ttl_horas ?? 72 },
    });
  },
};
