import { apiFetch } from './http';
import { MetricasDashboardResponse } from '../../types/metricas.types';

export interface GetDashboardOptions {
  idUsuario?: string | null;
}

function dashboardEndpoint(opts?: GetDashboardOptions): string {
  const params = new URLSearchParams();
  const id = opts?.idUsuario?.trim();
  if (id) params.set('id_usuario', id);
  const q = params.toString();
  return q ? `/metricas/dashboard?${q}` : '/metricas/dashboard';
}

export const metricasService = {
  /**
   * Obtiene el dashboard de métricas (se adapta al rol del usuario)
   */
  async getDashboard(opts?: GetDashboardOptions): Promise<MetricasDashboardResponse> {
    return apiFetch<MetricasDashboardResponse>(dashboardEndpoint(opts), {
      method: 'GET',
    });
  },
};
