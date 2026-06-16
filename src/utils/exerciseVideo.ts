import { PlanEjercicioItem } from '../types/planes.types';
import { Tutorial } from '../types/tutoriales.types';
import { VideoFeedItem } from '../types/video.types';
import { videosService } from '../services/api/videos.service';
import { tutorialesService } from '../services/api/tutoriales.service';
import { ejerciciosService } from '../services/api/ejercicios.service';
import { resolveYouTubeVideoId } from './youtubeEmbed';

function firstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function buildItemFromYouTubeIds(options: {
  id: string;
  titulo: string;
  videoId?: string | null;
  videoUrl?: string;
  embedUrl?: string;
  thumbnail?: string;
  descripcion?: string;
  instructor?: string;
  subtitle?: string;
}): VideoFeedItem | null {
  const videoId =
    resolveYouTubeVideoId({
      videoId: options.videoId,
      videoUrl: options.videoUrl,
      embedUrl: options.embedUrl,
    }) ?? null;
  if (!videoId && !options.videoUrl && !options.embedUrl) return null;

  const watchUrl =
    options.videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined);
  const embed =
    options.embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : undefined);

  return {
    id: options.id,
    titulo: options.titulo,
    descripcion: options.descripcion,
    instructor: options.instructor,
    videoUrl: watchUrl,
    embedUrl: embed,
    videoId: videoId ?? undefined,
    thumbnail:
      options.thumbnail ||
      (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined),
    subtitle: options.subtitle,
  };
}

/** UUID de catálogo o YouTube id desde el ítem del plan o el ejercicio anidado. */
export function getEjercicioVideoId(ejercicio: PlanEjercicioItem): string | null {
  const fromRoot = ejercicio.id_video;
  if (fromRoot != null && String(fromRoot).trim()) return String(fromRoot).trim();

  const nested = ejercicio.ejercicio;
  if (nested && typeof nested === 'object') {
    const raw = nested as Record<string, unknown>;
    const idVid = raw.id_video;
    if (idVid != null && String(idVid).trim()) return String(idVid).trim();
  }
  return null;
}

export function videoFeedItemFromApiRecord(
  raw: unknown,
  nombre: string,
  bloqueNombre?: string,
  fallbackId?: string
): VideoFeedItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return buildItemFromYouTubeIds({
    id: firstString(r.id, fallbackId) ?? fallbackId ?? 'video',
    titulo: firstString(r.title, r.titulo, r.nombre, nombre) ?? nombre,
    videoId: firstString(r.video_id, r.videoId, r.youtube_id, r.youtubeId),
    videoUrl: firstString(r.url, r.video_url, r.watch_url, r.link),
    embedUrl: firstString(r.embed, r.embed_url),
    thumbnail: firstString(r.thumbnail, r.thumb),
    descripcion: firstString(r.description, r.descripcion),
    instructor: firstString(r.instructor) ?? 'GUIA FA',
    subtitle: bloqueNombre,
  });
}

/** Resuelve video embebido desde el objeto ejercicio del plan (sin fetch). */
export function videoFeedItemFromEjercicio(
  ejercicio: PlanEjercicioItem,
  nombre: string,
  bloqueNombre?: string
): VideoFeedItem | null {
  const nested = ejercicio.ejercicio;
  if (nested && typeof nested === 'object') {
    const raw = nested as Record<string, unknown>;
    const videoObj = raw.video;
    if (videoObj && typeof videoObj === 'object') {
      const item = videoFeedItemFromApiRecord(videoObj, nombre, bloqueNombre);
      if (item) return item;
    }

    const ytUrl = firstString(raw.url_youtube, raw.youtube_url, raw.video_url, raw.url);
    if (ytUrl) {
      const item = buildItemFromYouTubeIds({
        id: ejercicio.id ?? getEjercicioVideoId(ejercicio) ?? 'video',
        titulo: nombre,
        videoUrl: ytUrl,
        subtitle: bloqueNombre,
      });
      if (item) return item;
    }
  }

  const idVideo = getEjercicioVideoId(ejercicio);
  if (idVideo && /^[a-zA-Z0-9_-]{11}$/.test(idVideo)) {
    return buildItemFromYouTubeIds({
      id: idVideo,
      titulo: nombre,
      videoId: idVideo,
      subtitle: bloqueNombre,
    });
  }

  return null;
}

export function videoFeedItemFromTutorial(
  tutorial: Tutorial,
  nombre: string,
  bloqueNombre?: string
): VideoFeedItem {
  const videoId =
    resolveYouTubeVideoId({
      videoId: tutorial.id,
      embedUrl: tutorial.embedUrl,
      videoUrl: tutorial.videoUrl,
    }) ?? undefined;

  return {
    id: tutorial.catalogVideoId ?? tutorial.id,
    titulo: tutorial.titulo || nombre,
    descripcion: tutorial.descripcion,
    instructor: tutorial.instructor,
    videoUrl: tutorial.videoUrl,
    embedUrl: tutorial.embedUrl,
    videoId,
    thumbnail: tutorial.thumbnail,
    subtitle: bloqueNombre,
  };
}

async function fetchVideoByCatalogId(
  idVideo: string,
  nombre: string,
  bloqueNombre?: string
): Promise<VideoFeedItem | null> {
  const trimmed = idVideo.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return buildItemFromYouTubeIds({
      id: trimmed,
      titulo: nombre,
      videoId: trimmed,
      subtitle: bloqueNombre,
    });
  }

  try {
    const raw = await videosService.getById(trimmed);
    const fromVideos = videoFeedItemFromApiRecord(raw, nombre, bloqueNombre, trimmed);
    if (fromVideos?.videoId || fromVideos?.videoUrl) return fromVideos;
  } catch {
    /* GET /videos puede fallar; probamos tutoriales */
  }

  try {
    const tutorial = await tutorialesService.resolveVideoById(trimmed);
    if (tutorial) return videoFeedItemFromTutorial(tutorial, nombre, bloqueNombre);
  } catch {
    /* sin video en tutoriales */
  }

  return null;
}

/**
 * Resuelve el video de un ejercicio del plan (inline → GET /videos → tutoriales → catálogo ejercicio).
 * Misma cadena que el front web en PlanDetailsModal.
 */
export async function resolveExerciseVideoFeedItem(
  ejercicio: PlanEjercicioItem,
  nombre: string,
  bloqueNombre?: string
): Promise<VideoFeedItem | null> {
  const inline = videoFeedItemFromEjercicio(ejercicio, nombre, bloqueNombre);
  if (inline?.videoId || inline?.videoUrl) return inline;

  const idVideo = getEjercicioVideoId(ejercicio);
  if (idVideo) {
    const fromCatalog = await fetchVideoByCatalogId(idVideo, nombre, bloqueNombre);
    if (fromCatalog) return fromCatalog;
  }

  const idEjercicio = ejercicio.id_ejercicio;
  if (idEjercicio) {
    try {
      const cat = await ejerciciosService.getById(String(idEjercicio));
      if (cat) {
        const merged: PlanEjercicioItem = {
          ...ejercicio,
          id_video: ejercicio.id_video ?? cat.id_video ?? undefined,
          ejercicio: {
            ...(ejercicio.ejercicio ?? {}),
            ...cat,
            video: cat.video ?? ejercicio.ejercicio?.video,
          },
        };

        const fromMergedInline = videoFeedItemFromEjercicio(merged, cat.nombre || nombre, bloqueNombre);
        if (fromMergedInline?.videoId || fromMergedInline?.videoUrl) return fromMergedInline;

        const catVideoId = cat.id_video;
        if (catVideoId) {
          const fromCatVideo = await fetchVideoByCatalogId(String(catVideoId), cat.nombre || nombre, bloqueNombre);
          if (fromCatVideo) return fromCatVideo;
        }
      }
    } catch {
      /* catálogo no disponible */
    }
  }

  return inline;
}

export function ejercicioPuedeTenerVideo(ejercicio: PlanEjercicioItem): boolean {
  if (getEjercicioVideoId(ejercicio)) return true;
  if (videoFeedItemFromEjercicio(ejercicio, 'Ejercicio')) return true;
  if (ejercicio.id_ejercicio) return true;
  return false;
}
