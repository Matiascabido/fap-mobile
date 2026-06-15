import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';
import {
  buildYouTubeEmbedHtml,
  getYouTubeEmbedOrigin,
  resolveYouTubeVideoId,
} from '../../utils/youtubeEmbed';

interface VideoPlayerModalProps {
  visible: boolean;
  title?: string;
  embedUrl?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  onClose: () => void;
}

export default function VideoPlayerModal({
  visible,
  title,
  embedUrl,
  videoUrl,
  videoId,
  onClose,
}: VideoPlayerModalProps) {
  const insets = useSafeAreaInsets();

  const resolvedVideoId = useMemo(
    () => resolveYouTubeVideoId({ videoId, embedUrl, videoUrl }),
    [videoId, embedUrl, videoUrl]
  );

  const origin = useMemo(() => getYouTubeEmbedOrigin(), []);

  const watchUrl = resolvedVideoId
    ? `https://www.youtube.com/watch?v=${resolvedVideoId}`
    : videoUrl || embedUrl;

  if (!visible) return null;

  const openExternally = () => {
    if (watchUrl) Linking.openURL(watchUrl).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Video'}
          </Text>
          <View style={styles.headerActions}>
            {watchUrl ? (
              <TouchableOpacity onPress={openExternally} style={styles.iconBtn}>
                <MaterialCommunityIcons name="open-in-new" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} accessibilityLabel="Cerrar video">
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {!resolvedVideoId ? (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>No se pudo cargar el reproductor.</Text>
            {watchUrl ? (
              <TouchableOpacity style={styles.fallbackBtn} onPress={openExternally}>
                <Text style={styles.fallbackBtnText}>Abrir en YouTube</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <WebView
            source={{
              html: buildYouTubeEmbedHtml(resolvedVideoId, origin),
              baseUrl: origin,
            }}
            style={styles.webview}
            originWhitelist={['https://*']}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={palette.primary} />
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 4 },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  fallbackText: { color: '#FFFFFF', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  fallbackBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  fallbackBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
