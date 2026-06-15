import { apiFetch } from './http';
import { tokenStorage, userStorage } from './storage';

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface PermisoToken {
  codigo: string;
  scope: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
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

export const loginService = {
  async login(username: string, password: string): Promise<Usuario> {
    const payload: LoginRequestDTO = { username, password };
    
    const response = await apiFetch<LoginResponse>(
      '/login',
      {
        method: 'POST',
        data: payload,
      },
      { suppressGlobalAlert: true }
    );
    
    // Guardar token
    if (response.access_token) {
      await tokenStorage.setToken(response.access_token);
    }
    
    // Guardar usuario
    if (response.usuario) {
      await userStorage.setUser(response.usuario);
    }
    
    return response.usuario;
  },
  
  async logout(): Promise<void> {
    try {
      // Intentar logout en el backend
      await apiFetch(
        '/login/logout',
        { method: 'POST' },
        { suppressGlobalAlert: true }
      );
    } catch (error) {
      // Ignorar errores del backend en logout
      console.error('Error en logout:', error);
    } finally {
      // Limpiar storage local siempre
      await tokenStorage.removeToken();
      await userStorage.removeUser();
    }
  },
};
