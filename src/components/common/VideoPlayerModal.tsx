import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';

interface VideoPlayerModalProps {
  visible: boolean;
  title?: string;
  embedUrl?: string | null;
  onClose: () => void;
}

function buildEmbedHtml(embedUrl: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; }
  iframe { width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
  <iframe
    src="${embedUrl}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</body></html>`;
}

export default function VideoPlayerModal({
  visible,
  title,
  embedUrl,
  onClose,
}: VideoPlayerModalProps) {
  const insets = useSafeAreaInsets();

  if (!embedUrl) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Video'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Cerrar video">
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <WebView
          source={{ html: buildEmbedHtml(embedUrl) }}
          style={styles.webview}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          )}
        />
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
  closeBtn: { padding: 4 },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
