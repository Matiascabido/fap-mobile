import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PlanesStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import GroupedSection from '../../components/common/GroupedSection';
import ListRow from '../../components/common/ListRow';
import Button from '../../components/common/Button';
import { getEjercicioNombre } from '../../utils/planBloques';
import { ejerciciosService } from '../../services/api/ejercicios.service';
import { tutorialesService } from '../../services/api/tutoriales.service';
import { Tutorial } from '../../types/tutoriales.types';
import { VideoFeedItem } from '../../types/video.types';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';
import { resolveYouTubeVideoId } from '../../utils/youtubeEmbed';

type Route = RouteProp<PlanesStackParamList, 'PlanEjercicioDetail'>;

export default function PlanEjercicioDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useAppTheme();
  const { ejercicio, bloqueNombre } = route.params;

  const [descripcion, setDescripcion] = useState<string>(
    (ejercicio.ejercicio?.descripcion as string) || ''
  );
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [videoData, setVideoData] = useState<Tutorial | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const nombre = getEjercicioNombre(ejercicio);

  useEffect(() => {
    navigation.setOptions({ title: nombre });
  }, [navigation, nombre]);

  useEffect(() => {
    const idEjercicio = ejercicio.id_ejercicio;
    if (!descripcion && idEjercicio) {
      setLoadingDesc(true);
      ejerciciosService
        .getAll()
        .then((list) => {
          const found = list.find((e) => e.id === idEjercicio);
          if (found?.descripcion) setDescripcion(found.descripcion);
        })
        .finally(() => setLoadingDesc(false));
    }
  }, [descripcion, ejercicio.id_ejercicio]);

  useEffect(() => {
    const idVideo = ejercicio.id_video;
    if (!idVideo) return;
    setLoadingVideo(true);
    tutorialesService
      .resolveVideoById(String(idVideo))
      .then(setVideoData)
      .finally(() => setLoadingVideo(false));
  }, [ejercicio.id_video]);

  const videoFeedItem: VideoFeedItem | null = useMemo(() => {
    if (!videoData) return null;
    return {
      id: videoData.id,
      titulo: videoData.titulo || nombre,
      descripcion: videoData.descripcion,
      instructor: videoData.instructor,
      videoUrl: videoData.videoUrl,
      embedUrl: videoData.embedUrl,
      videoId: resolveYouTubeVideoId({
        videoId: videoData.id,
        embedUrl: videoData.embedUrl,
        videoUrl: videoData.videoUrl,
      }) ?? undefined,
      thumbnail: videoData.thumbnail,
      subtitle: bloqueNombre,
    };
  }, [videoData, nombre, bloqueNombre]);

  const hasStats = Boolean(ejercicio.series || ejercicio.reps || ejercicio.peso);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={styles.content}
    >
      {bloqueNombre ? (
        <Text style={[styles.contextLabel, { color: colors.secondaryLabel }]}>
          {bloqueNombre}
        </Text>
      ) : null}

      <Text style={[styles.heroTitle, typography.title2, { color: colors.label }]}>{nombre}</Text>

      {hasStats ? (
        <GroupedSection title="Prescripción">
          {ejercicio.series ? (
            <ListRow title="Series" detail={String(ejercicio.series)} isLast={!ejercicio.reps && !ejercicio.peso} />
          ) : null}
          {ejercicio.reps ? (
            <ListRow title="Repeticiones" detail={String(ejercicio.reps)} isLast={!ejercicio.peso} />
          ) : null}
          {ejercicio.peso ? <ListRow title="Peso" detail={String(ejercicio.peso)} isLast /> : null}
        </GroupedSection>
      ) : null}

      <GroupedSection title="Descripción">
        {loadingDesc ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <View style={styles.descBox}>
            <Text style={[styles.descText, { color: colors.label }]}>
              {descripcion || 'Sin descripción disponible para este ejercicio.'}
            </Text>
          </View>
        )}
      </GroupedSection>

      {ejercicio.id_video ? (
        <GroupedSection title="Demostración en video">
          {loadingVideo ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.tint} />
            </View>
          ) : videoFeedItem ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowVideo(true)}
              style={styles.videoCard}
            >
              {videoFeedItem.thumbnail ? (
                <Image source={{ uri: videoFeedItem.thumbnail }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                  <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.playOverlay}>
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={22} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.videoMeta}>
                <Text style={styles.videoMetaTitle} numberOfLines={2}>
                  {videoFeedItem.titulo}
                </Text>
                <Text style={styles.videoMetaSub}>Tocá para ver en pantalla completa</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.descBox}>
              <Text style={[styles.descText, { color: colors.secondaryLabel }]}>
                No se pudo cargar el video asociado.
              </Text>
            </View>
          )}
          {videoFeedItem ? (
            <View style={styles.videoBtnWrap}>
              <Button title="Ver demostración" variant="filled" onPress={() => setShowVideo(true)} icon="play" />
            </View>
          ) : null}
        </GroupedSection>
      ) : null}

      <VideoPlayerModal
        visible={showVideo}
        items={videoFeedItem ? [videoFeedItem] : []}
        onClose={() => setShowVideo(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  contextLabel: { fontSize: 13, marginBottom: 4, marginLeft: 4 },
  heroTitle: { marginBottom: 20, marginLeft: 4 },
  loadingRow: { padding: 24, alignItems: 'center' },
  descBox: { padding: 16 },
  descText: { fontSize: 17, lineHeight: 24 },
  videoCard: {
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 200,
  },
  thumbnail: { width: '100%', height: 200 },
  thumbnailFallback: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  videoMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  videoMetaTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  videoMetaSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  videoBtnWrap: { paddingHorizontal: 16, paddingBottom: 16 },
});
