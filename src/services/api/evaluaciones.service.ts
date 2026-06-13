import { apiFetch } from './http';
import {
  EvaluacionGrupo,
  EvaluacionRegistroResumen,
  EvaluacionRegistroResponse,
  ListRegistrosParams,
} from '../../types/evaluaciones.types';

function normalizeGrupoList(raw: unknown): EvaluacionGrupo[] {
  if (Array.isArray(raw)) return raw as EvaluacionGrupo[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as EvaluacionGrupo[];
    if (Array.isArray(o.data)) return o.data as EvaluacionGrupo[];
  }
  return [];
}

function normalizeRegistroList(raw: unknown): EvaluacionRegistroResumen[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'registros', 'records']) {
      const v = o[key];
      if (Array.isArray(v)) {
        arr = v;
        break;
      }
    }
  }
  return arr.filter(
    (x): x is EvaluacionRegistroResumen =>
      x != null && typeof x === 'object' && 'id' in x
  );
}

function registroTimestamp(r: EvaluacionRegistroResumen): number {
  const raw = r.fecha_evaluacion || r.created_date || '';
  const t = new Date(raw.replace(/-/g, '/')).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortRegistrosDesc(
  list: EvaluacionRegistroResumen[]
): EvaluacionRegistroResumen[] {
  return [...list].sort((a, b) => {
    const diff = registroTimestamp(b) - registroTimestamp(a);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export const evaluacionesService = {
  /**
   * Obtiene el catálogo de grupos/secciones/pruebas
   */
  async getCatalogo(): Promise<EvaluacionGrupo[]> {
    const raw = await apiFetch<unknown>('/evaluaciones/catalogo', { method: 'GET' });
    return normalizeGrupoList(raw);
  },

  /**
   * Lista los registros de evaluación de un socio
   */
  async listRegistros(params: ListRegistrosParams): Promise<EvaluacionRegistroResumen[]> {
    const q = new URLSearchParams();
    q.set('id_usuario_socio', params.id_usuario_socio);
    if (params.id_prueba) q.set('id_prueba', params.id_prueba);
    q.set('skip', String(((params.page ?? 1) - 1) * (params.limit ?? 100)));
    q.set('limit', String(params.limit ?? 100));
    const raw = await apiFetch<unknown>(`/evaluaciones/registros?${q.toString()}`, {
      method: 'GET',
    });
    return sortRegistrosDesc(normalizeRegistroList(raw));
  },

  /**
   * Obtiene un registro completo con sus valores
   */
  async getRegistro(idRegistro: string): Promise<EvaluacionRegistroResponse> {
    return apiFetch<EvaluacionRegistroResponse>(
      `/evaluaciones/registros/${encodeURIComponent(idRegistro)}`,
      { method: 'GET' }
    );
  },
};
