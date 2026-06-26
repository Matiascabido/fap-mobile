export const FOTO_PERFIL_MAX_BYTES = 5 * 1024 * 1024;
export const FOTO_PERFIL_INPUT_MAX_BYTES = 25 * 1024 * 1024;
export const FOTO_PERFIL_TARGET_BYTES = 200_000;
export const FOTO_PERFIL_MAX_EDGE = 512;
export const FOTO_PERFIL_MIN_EDGE = 256;
export const FOTO_PERFIL_INITIAL_QUALITY = 0.88;
export const FOTO_PERFIL_MIN_QUALITY = 0.62;
export const FOTO_PERFIL_QUALITY_STEP = 0.06;

export const FOTO_PERFIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type FotoPerfilMimeType = (typeof FOTO_PERFIL_MIME_TYPES)[number];

export const FOTO_PERFIL_REQUIREMENTS_HINT =
  'Formatos: JPEG, PNG o WebP. Máximo: 5 MB.';

export const FOTO_PERFIL_UPLOAD_ERROR_MESSAGE =
  `No se pudo subir la foto. ${FOTO_PERFIL_REQUIREMENTS_HINT}`;

export const FOTO_PERFIL_ELITE_MESSAGE = 'Foto de perfil disponible en plan Elite';

export const FOTO_PERFIL_UNSUPPORTED_FORMAT_MESSAGE =
  `Formato no soportado. ${FOTO_PERFIL_REQUIREMENTS_HINT}`;

export const FOTO_PERFIL_INPUT_TOO_LARGE_MESSAGE =
  'La imagen es demasiado pesada (máximo 25 MB antes de optimizar).';

export function parsePerfilFotoUrl(response: {
  foto_url?: string;
  url?: string;
}): string | undefined {
  return response.foto_url?.trim() || response.url?.trim() || undefined;
}
