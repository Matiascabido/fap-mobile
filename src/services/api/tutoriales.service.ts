import { apiFetch } from './http';
import { Tutorial, TutorialesResponse } from '../../types/tutoriales.types';

export const TUTORIALES_PAGE_SIZE = 12;

function getYouTubeVideoId(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1);
    }
    if (hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] ?? '';
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.replace('/embed/', '');
      }
      return parsed.searchParams.get('v') ?? '';
    }
    return '';
  } catch {
    return '';
  }
}

function esUuidCatalogo(v: unknown): v is string {
  if (v == null || typeof v !== 'string') return false;
  const s = v.trim();
  if (!s) return false;
  const hex = s.replace(/-/g, '');
  return hex.length === 32 && /^[0-9a-f]+$/i.test(hex);
}

function firstNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    if (v != null && typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function formatPublishedDate(publishedAt: string): string {
  if (!publishedAt) return '';
  const d = new Date(publishedAt);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function normalizeGrupos(r: Record<string, unknown>): string[] {
  const out: string[] = [];
  const g = r.grupos;
  if (Array.isArray(g)) {
    for (const x of g) {
      if (typeof x === 'string' && x.trim()) out.push(x.trim());
      else if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>;
        const s = firstNonEmptyString(o.nombre, o.name, o.label, o.grupo, o.title);
        if (s) out.push(s);
      }
    }
  } else if (typeof g === 'string' && g.trim()) {
    out.push(g.trim());
  }
  const one = firstNonEmptyString(r.grupo, r.group);
  if (one) out.push(one);
  return [...new Set(out)];
}

function coerceRowToTutorial(raw: unknown): Tutorial | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  let videoId = firstNonEmptyString(r.video_id, r.videoId, r.youtube_id, r.youtubeId);
  const url0 = firstNonEmptyString(r.url, r.videoUrl, r.video_url, r.link);
  const embed0 = firstNonEmptyString(r.embed, r.embedUrl, r.embed_url);
  if (!videoId && url0) videoId = getYouTubeVideoId(url0);
  if (!videoId && embed0) videoId = getYouTubeVideoId(embed0);

  const idRaw = r.id;
  const id = idRaw != null && String(idRaw).trim() ? String(idRaw).trim() : undefined;
  if (!videoId && id) videoId = id;

  const title = firstNonEmptyString(r.title, r.titulo, r.name, r.nombre) || 'Video';
  if (!videoId && !url0 && !embed0) return null;

  const published = firstNonEmptyString(
    r.published,
    r.publishedAt,
    r.published_at,
    r.created_date
  );

  const isYoutubeId = Boolean(videoId && !esUuidCatalogo(videoId));
  const url = url0 || (isYoutubeId ? `https://www.youtube.com/watch?v=${videoId}` : '');
  const embed = embed0 || (isYoutubeId ? `https://www.youtube.com/embed/${videoId}` : '');
  const thumbnail =
    firstNonEmptyString(r.thumbnail, r.thumb) ||
    (isYoutubeId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  return {
    id: videoId || 'unknown',
    catalogVideoId: esUuidCatalogo(id) ? id : undefined,
    titulo: title,
    descripcion: published
      ? `Publicado el ${formatPublishedDate(published)}`
      : 'Video del canal GUIA FA',
    videoUrl: url,
    embedUrl: embed,
    thumbnail,
    instructor: 'GUIA FA',
    publishedAt: published || new Date().toISOString(),
    grupos: normalizeGrupos(r),
  };
}

function normalizeEnvelope(raw: unknown): { itemsRaw: unknown[]; total: number } {
  if (raw == null) return { itemsRaw: [], total: 0 };
  if (Array.isArray(raw)) return { itemsRaw: raw, total: raw.length };
  if (typeof raw !== 'object') return { itemsRaw: [], total: 0 };
  const o = raw as Record<string, unknown>;
  let itemsRaw: unknown[] = [];
  if (Array.isArray(o.items)) itemsRaw = o.items;
  else if (Array.isArray(o.data)) itemsRaw = o.data;
  else if (Array.isArray(o.results)) itemsRaw = o.results;
  else if (Array.isArray(o.videos)) itemsRaw = o.videos;
  const total =
    typeof o.total === 'number' ? o.total : typeof o.count === 'number' ? o.count : itemsRaw.length;
  return { itemsRaw, total: Math.max(0, Math.floor(total)) };
}

export const tutorialesService = {
  /**
   * Obtiene los grupos/categorías de tutoriales
   */
  async getGrupos(): Promise<string[]> {
    try {
      const data = await apiFetch<{ grupos: string[] }>(
        '/tutoriales/grupos',
        { method: 'GET' },
        { suppressGlobalAlert: true }
      );
      return data.grupos ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Lista tutoriales con paginación y filtros
   */
  async getTutoriales(
    skip = 0,
    limit = TUTORIALES_PAGE_SIZE,
    search = '',
    grupo = ''
  ): Promise<TutorialesResponse> {
    const params = new URLSearchParams();
    const s = search.trim();
    const g = grupo.trim();
    if (s) params.set('search', s);
    if (g) params.set('grupo', g);
    params.set('skip', String(skip));
    params.set('limit', String(limit));

    const raw = await apiFetch<unknown>(
      `/tutoriales/?${params.toString()}`,
      { method: 'GET' },
      { suppressGlobalAlert: true }
    );
    const env = normalizeEnvelope(raw);

    const items: Tutorial[] = [];
    for (const row of env.itemsRaw) {
      const t = coerceRowToTutorial(row);
      if (t) items.push(t);
    }

    return { total: env.total, skip, limit, items };
  },

  /** Resuelve un video del catálogo por id (UUID o YouTube id). */
  async resolveVideoById(id: string): Promise<import('../../types/tutoriales.types').Tutorial | null> {
    const trimmed = id?.trim();
    if (!trimmed) return null;

    try {
      const raw = await apiFetch<unknown>(
        `/tutoriales/${encodeURIComponent(trimmed)}`,
        { method: 'GET' },
        { suppressGlobalAlert: true }
      );
      const t = coerceRowToTutorial(raw);
      if (t) return t;
    } catch {
      // continuar con búsqueda en listado
    }

    const res = await this.getTutoriales(0, 200);
    const found = res.items.find(
      (t) => t.id === trimmed || t.catalogVideoId === trimmed
    );
    if (found) return found;

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return {
        id: trimmed,
        titulo: 'Demostración',
        descripcion: 'Video de ejercicio',
        videoUrl: `https://www.youtube.com/watch?v=${trimmed}`,
        embedUrl: `https://www.youtube.com/embed/${trimmed}`,
        thumbnail: `https://i.ytimg.com/vi/${trimmed}/hqdefault.jpg`,
        instructor: 'GUIA FA',
        publishedAt: new Date().toISOString(),
        grupos: [],
      };
    }

    return null;
  },
};
