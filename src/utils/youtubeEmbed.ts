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

export function buildYouTubeEmbedUrl(
  videoId: string,
  origin = getYouTubeEmbedOrigin(),
  options?: { autoplay?: boolean; mute?: boolean }
): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    origin,
    enablejsapi: '1',
  });
  if (options?.autoplay) params.set('autoplay', '1');
  if (options?.mute) params.set('mute', '1');
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** Evita que el WebView siga redirecciones de YouTube que reinician el embed en Android. */
export function shouldAllowYouTubeWebViewNavigation(url: string, origin = getYouTubeEmbedOrigin()): boolean {
  if (!url || url === 'about:blank') return true;
  if (url.startsWith(origin)) return true;
  if (/^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//.test(url)) return true;
  return false;
}

export function buildYouTubeEmbedHtml(
  videoId: string,
  origin = getYouTubeEmbedOrigin(),
  options?: { autoplay?: boolean; mute?: boolean }
): string {
  const autoplay = options?.autoplay ? 1 : 0;
  const mute = options?.mute ? 1 : 0;
  const safeVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeOrigin = origin.replace(/['"\\]/g, '');

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  #player { width: 100%; height: 100%; }
</style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player;
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${safeVideoId}',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: '${safeOrigin}',
          enablejsapi: 1,
          autoplay: ${autoplay},
          mute: ${mute},
          loop: 0,
        },
        events: {
          onReady: function(e) {
            if (${autoplay}) e.target.playVideo();
          },
          onStateChange: function(e) {
            if (e.data === YT.PlayerState.ENDED) e.target.stopVideo();
          },
        },
      });
    }
    window.pauseVideo = function() { try { player && player.pauseVideo && player.pauseVideo(); } catch (e) {} };
    window.playVideo = function() { try { player && player.playVideo && player.playVideo(); } catch (e) {} };
    window.stopVideo = function() { try { player && player.stopVideo && player.stopVideo(); } catch (e) {} };
  </script>
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
