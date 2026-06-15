import { apiFetch } from './http';
import { config } from '../../constants/config';
import { clearClientSession, tokenStorage, userStorage } from './storage';

export interface LoginRequestDTO {
  user_mail: string;
  user_pass: string;
}

export interface PermisoToken {
  codigo: string;
  scope: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  mail: string;
  rol: string;
  grupo: string;
  estado: boolean;
  permisos: PermisoToken[];
}

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
}

function loginErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data.trim();

  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === 'string' && detail.trim()) return detail.trim();

    if (Array.isArray(detail)) {
      const messages = detail.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          const msg = String((item as { msg?: unknown }).msg ?? '');
          const loc = (item as { loc?: unknown[] }).loc;
          const field = Array.isArray(loc) ? String(loc[loc.length - 1] ?? '') : '';

          if (field === 'user_mail') return 'El correo es obligatorio';
          if (field === 'user_pass') return 'La contraseña es obligatoria';
          return msg;
        }
        return '';
      });
      const joined = messages.filter(Boolean).join('. ');
      if (joined) return joined;
    }
  }

  if (status === 401) return 'Usuario o contraseña incorrectos';
  return 'No se pudo iniciar sesión. Intentá de nuevo.';
}

export const loginService = {
  async login(username: string, password: string): Promise<Usuario> {
    await clearClientSession();

    const userMail = username.trim();
    const userPass = password;

    if (!userMail || !userPass.trim()) {
      throw new Error('Por favor, completá correo y contraseña.');
    }

    const body = JSON.stringify({
      user_mail: userMail,
      user_pass: userPass,
    } satisfies LoginRequestDTO);

    if (__DEV__) {
      console.log('[API] POST /login', { user_mail: userMail });
    }

    let response: Response;
    try {
      response = await fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      });
    } catch (error) {
      console.error('Error API /login:', error);
      throw new Error(
        'No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.'
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('Respuesta inválida del servidor.');
    }

    if (!response.ok) {
      const message = loginErrorMessage(data, response.status);
      if (__DEV__) {
        console.error('Error API /login:', response.status, '/login', message);
      }
      throw new Error(message);
    }

    const loginData = data as LoginResponse;

    if (loginData.access_token) {
      await tokenStorage.setToken(loginData.access_token);
    }

    if (loginData.usuario) {
      await userStorage.setUser(loginData.usuario);
    }

    return loginData.usuario;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch(
        '/login/logout',
        { method: 'POST' },
        { suppressGlobalAlert: true }
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error API /login/logout:', error);
      }
    } finally {
      await tokenStorage.removeToken();
      await userStorage.removeUser();
    }
  },
};
