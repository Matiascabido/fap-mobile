import { apiFetch } from './http';
import {
  EvaluacionGrupo,
  EvaluacionPruebaDetalle,
  EvaluacionRegistroCreate,
  EvaluacionRegistroResumen,
  EvaluacionRegistroResponse,
  ListRegistrosParams,
} from '../../types/evaluaciones.types';
import { registroTimestamp } from '../../utils/evaluaciones/registrosTimeline';

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

function totalFromRegistroListPayload(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  for (const k of ['total', 'count', 'total_count'] as const) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.floor(v);
  }
  return null;
}

function sortRegistrosDesc(list: EvaluacionRegistroResumen[]): EvaluacionRegistroResumen[] {
  return [...list].sort((a, b) => {
    const diff = registroTimestamp(b) - registroTimestamp(a);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export const evaluacionesService = {
  async getCatalogo(): Promise<EvaluacionGrupo[]> {
    const raw = await apiFetch<unknown>('/evaluaciones/catalogo', { method: 'GET' });
    return normalizeGrupoList(raw);
  },

  async getCamposPrueba(idPrueba: string): Promise<EvaluacionPruebaDetalle> {
    return apiFetch<EvaluacionPruebaDetalle>(
      `/evaluaciones/pruebas/${encodeURIComponent(idPrueba)}/campos`,
      { method: 'GET' }
    );
  },

  async createRegistro(body: EvaluacionRegistroCreate): Promise<EvaluacionRegistroResponse> {
    return apiFetch<EvaluacionRegistroResponse>(
      '/evaluaciones/registros',
      {
        method: 'POST',
        data: body,
      },
      { suppressGlobalAlert: true }
    );
  },

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

  async listAllRegistros(
    params: Omit<ListRegistrosParams, 'page' | 'limit'>
  ): Promise<EvaluacionRegistroResumen[]> {
    const pageSize = 500;
    const byId = new Map<string, EvaluacionRegistroResumen>();
    const maxSkip = 50_000;

    for (let skip = 0; skip <= maxSkip; skip += pageSize) {
      const q = new URLSearchParams();
      q.set('id_usuario_socio', params.id_usuario_socio);
      if (params.id_prueba) q.set('id_prueba', params.id_prueba);
      q.set('skip', String(skip));
      q.set('limit', String(pageSize));

      const raw = await apiFetch<unknown>(`/evaluaciones/registros?${q.toString()}`, { method: 'GET' });
      const batch = normalizeRegistroList(raw);
      const total = totalFromRegistroListPayload(raw);
      const sizeBefore = byId.size;

      for (const row of batch) {
        byId.set(row.id, row);
      }

      if (batch.length === 0) break;
      if (total != null && byId.size >= total) break;
      if (batch.length < pageSize) break;
      if (skip > 0 && byId.size === sizeBefore) break;
    }

    return sortRegistrosDesc(Array.from(byId.values()));
  },

  async getRegistro(idRegistro: string): Promise<EvaluacionRegistroResponse> {
    return apiFetch<EvaluacionRegistroResponse>(
      `/evaluaciones/registros/${encodeURIComponent(idRegistro)}`,
      { method: 'GET' }
    );
  },
};
