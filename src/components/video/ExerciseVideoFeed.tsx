import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoFeedItem } from '../../types/video.types';
import { palette } from '../../constants/colors';
import {
  buildYouTubeEmbedHtml,
  getYouTubeEmbedOrigin,
  resolveYouTubeVideoId,
} from '../../utils/youtubeEmbed';
import { useVideoFeed } from '../../context/VideoFeedContext';
import { hapticSelection } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExerciseVideoFeedProps {
  visible: boolean;
  items: VideoFeedItem[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

function VideoPage({
  item,
  isActive,
  height,
}: {
  item: VideoFeedItem;
  isActive: boolean;
  height: number;
}) {
  const origin = useMemo(() => getYouTubeEmbedOrigin(), []);
  const resolvedVideoId = useMemo(
    () =>
      resolveYouTubeVideoId({
        videoId: item.videoId,
        embedUrl: item.embedUrl,
        videoUrl: item.videoUrl,
      }),
    [item]
  );

  if (!resolvedVideoId) {
    return (
      <View style={[styles.page, { height }]}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>No se pudo cargar el video.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.page, { height }]}>
      {isActive ? (
        <WebView
          key={`${item.id}-${resolvedVideoId}`}
          source={{
            html: buildYouTubeEmbedHtml(resolvedVideoId, origin, { autoplay: true, mute: false }),
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
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        />
      ) : (
        <View style={styles.inactivePage} />
      )}
    </View>
  );
}

export default function ExerciseVideoFeed({
  visible,
  items,
  initialIndex = 0,
  onClose,
  onIndexChange,
}: ExerciseVideoFeedProps) {
  const insets = useSafeAreaInsets();
  const { setVideoFeedOpen } = useVideoFeed();
  const listRef = useRef<FlatList<VideoFeedItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const pageHeight = SCREEN_HEIGHT;

  useEffect(() => {
    setVideoFeedOpen(visible);
    return () => setVideoFeedOpen(false);
  }, [visible, setVideoFeedOpen]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      });
    }
  }, [visible, initialIndex]);

  const currentItem = items[currentIndex];

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= items.length) return;
      hapticSelection();
      setCurrentIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
      onIndexChange?.(next);
    },
    [items.length, onIndexChange]
  );

  const openExternally = useCallback(() => {
    const item = items[currentIndex];
    const videoId = resolveYouTubeVideoId({
      videoId: item?.videoId,
      embedUrl: item?.embedUrl,
      videoUrl: item?.videoUrl,
    });
    const url = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : item?.videoUrl || item?.embedUrl;
    if (url) Linking.openURL(url).catch(() => {});
  }, [currentIndex, items]);

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={pageHeight}
          snapToAlignment="start"
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
            if (index !== currentIndex && index >= 0 && index < items.length) {
              setCurrentIndex(index);
              onIndexChange?.(index);
            }
          }}
          renderItem={({ item, index }) => (
            <VideoPage item={item} isActive={index === currentIndex} height={pageHeight} />
          )}
        />

        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onClose}
              accessibilityLabel="Cerrar video"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topCounter}>
              {currentIndex + 1} / {items.length}
            </Text>
            <TouchableOpacity style={styles.iconCircle} onPress={openExternally}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={[styles.bottomGradient, { paddingBottom: insets.bottom + 24 }]}
            pointerEvents="box-none"
          >
            <View style={styles.bottomContent}>
              <View style={styles.metaBlock}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {currentItem?.titulo || 'Video'}
                </Text>
                {currentItem?.instructor ? (
                  <Text style={styles.videoSubtitle}>{currentItem.instructor}</Text>
                ) : null}
                {currentItem?.subtitle ? (
                  <Text style={styles.videoDetail}>{currentItem.subtitle}</Text>
                ) : null}
                {currentItem?.descripcion ? (
                  <Text style={styles.videoDesc} numberOfLines={3}>
                    {currentItem.descripcion}
                  </Text>
                ) : null}
              </View>

              <View style={styles.rail}>
                <RailButton
                  icon="chevron-up"
                  label="Anterior"
                  disabled={currentIndex <= 0}
                  onPress={() => goTo(currentIndex - 1)}
                />
                <RailButton
                  icon="chevron-down"
                  label="Siguiente"
                  disabled={currentIndex >= items.length - 1}
                  onPress={() => goTo(currentIndex + 1)}
                />
                <RailButton icon="open-outline" label="YouTube" onPress={openExternally} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

function RailButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.railBtn, disabled && styles.railBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
    >
      <View style={styles.railIconCircle}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.railLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  page: { width: '100%', backgroundColor: '#000' },
  inactivePage: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: '#FFFFFF', fontSize: 15 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topCounter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaBlock: { flex: 1, paddingRight: 8 },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  videoDetail: { color: palette.primary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  videoDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  rail: { alignItems: 'center', gap: 14, marginBottom: Platform.OS === 'ios' ? 8 : 0 },
  railBtn: { alignItems: 'center', gap: 4 },
  railBtnDisabled: { opacity: 0.35 },
  railIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  railLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
});
