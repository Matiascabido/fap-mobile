import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  FOTO_PERFIL_INPUT_MAX_BYTES,
  FOTO_PERFIL_INPUT_TOO_LARGE_MESSAGE,
  FOTO_PERFIL_INITIAL_QUALITY,
  FOTO_PERFIL_MAX_EDGE,
  FOTO_PERFIL_MIN_EDGE,
  FOTO_PERFIL_MIN_QUALITY,
  FOTO_PERFIL_MIME_TYPES,
  FOTO_PERFIL_QUALITY_STEP,
  FOTO_PERFIL_TARGET_BYTES,
  FOTO_PERFIL_UNSUPPORTED_FORMAT_MESSAGE,
  type FotoPerfilMimeType,
} from './perfilFotoUpload';

export type OptimizedProfileImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg' | 'image/webp';
  originalBytes: number;
  optimizedBytes: number;
};

export function computeScaledDimensions(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function normalizeMimeType(mimeType?: string | null): FotoPerfilMimeType | null {
  const normalized = mimeType?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'image/jpg') return 'image/jpeg';
  return (FOTO_PERFIL_MIME_TYPES as readonly string[]).includes(normalized)
    ? (normalized as FotoPerfilMimeType)
    : null;
}

async function getFileBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info && typeof info.size === 'number') {
    return info.size;
  }
  return 0;
}

async function compressImage(
  uri: string,
  width: number,
  height: number,
  maxEdge: number,
  preferWebp: boolean
): Promise<{ uri: string; width: number; height: number; bytes: number; mimeType: 'image/jpeg' | 'image/webp' }> {
  const scaled = computeScaledDimensions(width, height, maxEdge);
  const resizeAction =
    scaled.width >= scaled.height
      ? { resize: { width: scaled.width } as const }
      : { resize: { height: scaled.height } as const };

  let format = preferWebp ? ImageManipulator.SaveFormat.WEBP : ImageManipulator.SaveFormat.JPEG;
  let mimeType: 'image/jpeg' | 'image/webp' = preferWebp ? 'image/webp' : 'image/jpeg';
  let quality = FOTO_PERFIL_INITIAL_QUALITY;
  let lastResult: ImageManipulator.ImageResult | null = null;

  const runPass = async (currentFormat: ImageManipulator.SaveFormat) =>
    ImageManipulator.manipulateAsync(uri, [resizeAction], {
      compress: quality,
      format: currentFormat,
    });

  while (quality >= FOTO_PERFIL_MIN_QUALITY) {
    try {
      lastResult = await runPass(format);
    } catch {
      if (format === ImageManipulator.SaveFormat.WEBP) {
        format = ImageManipulator.SaveFormat.JPEG;
        mimeType = 'image/jpeg';
        lastResult = await runPass(format);
      } else {
        throw new Error('No se pudo optimizar la imagen.');
      }
    }

    const bytes = await getFileBytes(lastResult.uri);
    if (bytes <= FOTO_PERFIL_TARGET_BYTES || quality <= FOTO_PERFIL_MIN_QUALITY) {
      return {
        uri: lastResult.uri,
        width: lastResult.width,
        height: lastResult.height,
        bytes,
        mimeType,
      };
    }
    quality = Math.max(FOTO_PERFIL_MIN_QUALITY, quality - FOTO_PERFIL_QUALITY_STEP);
  }

  if (!lastResult) {
    throw new Error('No se pudo optimizar la imagen.');
  }

  const bytes = await getFileBytes(lastResult.uri);
  return {
    uri: lastResult.uri,
    width: lastResult.width,
    height: lastResult.height,
    bytes,
    mimeType,
  };
}

export async function optimizeProfileImage(input: {
  uri: string;
  width: number;
  height: number;
  mimeType?: string | null;
  fileSize?: number | null;
}): Promise<OptimizedProfileImage> {
  const mime = normalizeMimeType(input.mimeType);
  if (!mime) {
    throw new Error(FOTO_PERFIL_UNSUPPORTED_FORMAT_MESSAGE);
  }

  const originalBytes =
    input.fileSize != null && input.fileSize > 0
      ? input.fileSize
      : await getFileBytes(input.uri);

  if (originalBytes > FOTO_PERFIL_INPUT_MAX_BYTES) {
    throw new Error(FOTO_PERFIL_INPUT_TOO_LARGE_MESSAGE);
  }

  const preferWebp = true;
  let maxEdge = FOTO_PERFIL_MAX_EDGE;
  let lastAttempt: Awaited<ReturnType<typeof compressImage>> | null = null;

  while (maxEdge >= FOTO_PERFIL_MIN_EDGE) {
    lastAttempt = await compressImage(
      input.uri,
      input.width,
      input.height,
      maxEdge,
      preferWebp
    );
    if (lastAttempt.bytes <= FOTO_PERFIL_TARGET_BYTES) {
      break;
    }
    maxEdge -= 77;
  }

  if (!lastAttempt) {
    throw new Error('No se pudo optimizar la imagen.');
  }

  return {
    uri: lastAttempt.uri,
    width: lastAttempt.width,
    height: lastAttempt.height,
    mimeType: lastAttempt.mimeType,
    originalBytes,
    optimizedBytes: lastAttempt.bytes,
  };
}

export function optimizedProfileFileName(mimeType: 'image/jpeg' | 'image/webp'): string {
  return mimeType === 'image/webp' ? 'foto-perfil.webp' : 'foto-perfil.jpg';
}
