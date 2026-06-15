import Constants from 'expo-constants';

const FALLBACK_ORIGIN = 'https://com.fap.mobile';

/** Origen que YouTube exige para embeds en WebView (bundle id como https URL). */
export function getYouTubeEmbedOrigin(): string {
  const ios = Constants.expoConfig?.ios?.bundleIdentifier;
  const android = Constants.expoConfig?.android?.package;
  const id = ios || android || FALLBACK_ORIGIN.replace('https://', '');
  return `https://${id}`;
}

export function extractYouTubeVideoId(urlOrId?: string | null): string | null {
  if (!urlOrId?.trim()) return null;
  const raw = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] ?? null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] ?? null;
      }
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYouTubeEmbedUrl(videoId: string, origin = getYouTubeEmbedOrigin()): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    origin,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function buildYouTubeEmbedHtml(videoId: string, origin = getYouTubeEmbedOrigin()): string {
  const src = buildYouTubeEmbedUrl(videoId, origin);
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; }
  iframe { width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
  <iframe
    src="${src}"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    allowfullscreen
  ></iframe>
</body></html>`;
}

export function resolveYouTubeVideoId(options: {
  videoId?: string | null;
  embedUrl?: string | null;
  videoUrl?: string | null;
}): string | null {
  return (
    extractYouTubeVideoId(options.videoId) ||
    extractYouTubeVideoId(options.embedUrl) ||
    extractYouTubeVideoId(options.videoUrl)
  );
}
