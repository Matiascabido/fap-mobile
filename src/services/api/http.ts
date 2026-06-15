import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../../constants/config';
import { clearClientSession, tokenStorage } from './storage';
import { Alert } from 'react-native';

/** 401 con redirección a login: no mostrar alert genérico */
export class UnauthorizedSessionError extends Error {
  constructor() {
    super('Sesión expirada o no autorizada');
    this.name = 'UnauthorizedSessionError';
  }
}

// Callback para navegación (se setea desde el App Navigator)
let navigationCallback: ((route: string) => void) | null = null;
let unauthorizedCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (route: string) => void) {
  navigationCallback = callback;
}

export function setUnauthorizedCallback(callback: () => void) {
  unauthorizedCallback = callback;
}

function handleUnauthorized(endpoint: string): void {
  if (!isCredentialLoginEndpoint(endpoint)) {
    void clearClientSession();
    unauthorizedCallback?.();
    navigationCallback?.('Login');
  }
}

export function isCredentialLoginEndpoint(endpoint: string): boolean {
  if (endpoint === '/login' || endpoint.startsWith('/login?')) return true;
  if (endpoint === '/login/token' || endpoint.startsWith('/login/token?')) return true;
  return false;
}

function requestPath(config: AxiosRequestConfig): string {
  const raw = config.url ?? '';
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw.split('?')[0] ?? raw;
}

/** Convierte `detail` de FastAPI u otros formatos en texto legible */
function stringifyApiErrorDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'msg' in item) {
        const msg = String((item as { msg?: unknown }).msg ?? '');
        const loc = (item as { loc?: unknown[] }).loc;
        const field = Array.isArray(loc) ? String(loc[loc.length - 1] ?? '') : '';

        if (field === 'user_mail' && msg.toLowerCase().includes('required')) {
          return 'El correo es obligatorio';
        }
        if (field === 'user_pass' && msg.toLowerCase().includes('required')) {
          return 'La contraseña es obligatoria';
        }

        return msg;
      }
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    });
    return parts.filter(Boolean).join('. ');
  }
  if (typeof detail === 'object') {
    const o = detail as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

function messageFromApiBody(data: unknown, status: number, statusText: string): string {
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (o.detail !== undefined) {
      const fromDetail = stringifyApiErrorDetail(o.detail);
      if (fromDetail) return fromDetail;
    }
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
    if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
  }
  return `Error ${status}: ${statusText || 'solicitud fallida'}`;
}

/** Evita mostrar códigos de permiso en alertas */
const MSG_HTTP_PERMISO_DENEGADO = 'No tenés los permisos necesarios para esta acción.';

function userFacingHttpErrorMessage(raw: string, status: number): string {
  if (status === 403) {
    const lower = raw.toLowerCase();
    if (
      lower.includes('permiso requerido') ||
      lower.includes('permission required') ||
      /\b[a-z][a-z0-9_]*:[a-z][a-z0-9_]*\b/i.test(raw)
    ) {
      return MSG_HTTP_PERMISO_DENEGADO;
    }
  }
  return raw;
}

/** Mensaje legible para errores de red */
export function formatNetworkErrorMessage(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (
    lower === 'network error' ||
    lower.includes('timeout') ||
    lower.includes('network request failed')
  ) {
    return 'No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.';
  }
  return raw;
}

function showErrorAlert(message: string): void {
  Alert.alert('Error', message, [{ text: 'OK' }]);
}

export type ApiFetchContext = {
  /** Evita alert ante fallos (p. ej. 404 esperado) */
  suppressGlobalAlert?: boolean;
};

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: agregar token (excepto en login)
api.interceptors.request.use(
  async (config) => {
    const path = requestPath(config);
    if (isCredentialLoginEndpoint(path)) {
      delete config.headers.Authorization;
      return config;
    }

    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: manejo de errores
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const endpoint = error.config?.url || '';
    
    if (error.response?.status === 401) {
      if (isCredentialLoginEndpoint(endpoint)) {
        const message = messageFromApiBody(
          error.response.data,
          error.response.status,
          error.response.statusText
        );
        throw new Error(message);
      }
      handleUnauthorized(endpoint);
      throw new UnauthorizedSessionError();
    }
    
    return Promise.reject(error);
  }
);

/**
 * Wrapper para peticiones API con manejo de errores
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: AxiosRequestConfig,
  ctx?: ApiFetchContext
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.request({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedSessionError) {
      throw error;
    }
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const statusText = error.response?.statusText || '';
      const raw = messageFromApiBody(error.response?.data, status, statusText);
      const message = userFacingHttpErrorMessage(raw, status);
      
      if (!ctx?.suppressGlobalAlert) {
        showErrorAlert(message);
      }
      
      throw new Error(message);
    }
    
    // Error de red u otro
    const message = formatNetworkErrorMessage(error instanceof Error ? error.message : String(error));
    if (!ctx?.suppressGlobalAlert) {
      showErrorAlert(message);
    }
    throw new Error(message);
  }
}

/**
 * Wrapper que expone response completo (útil para headers, etc.)
 */
export async function apiFetchWithResponse<T>(
  endpoint: string,
  options?: AxiosRequestConfig,
  ctx?: ApiFetchContext
): Promise<{ data: T; response: AxiosResponse<T> }> {
  try {
    const response: AxiosResponse<T> = await api.request({
      url: endpoint,
      ...options,
    });
    return { data: response.data, response };
  } catch (error) {
    if (error instanceof UnauthorizedSessionError) {
      throw error;
    }
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const statusText = error.response?.statusText || '';
      const raw = messageFromApiBody(error.response?.data, status, statusText);
      const message = userFacingHttpErrorMessage(raw, status);
      
      if (!ctx?.suppressGlobalAlert) {
        showErrorAlert(message);
      }
      
      throw new Error(message);
    }
    
    const message = formatNetworkErrorMessage(error instanceof Error ? error.message : String(error));
    if (!ctx?.suppressGlobalAlert) {
      showErrorAlert(message);
    }
    throw new Error(message);
  }
}

export default api;
