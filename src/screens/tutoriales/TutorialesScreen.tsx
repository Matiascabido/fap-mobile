import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tutorialesService, TUTORIALES_PAGE_SIZE } from '../../services/api/tutoriales.service';
import { Tutorial } from '../../types/tutoriales.types';
import { VideoFeedItem } from '../../types/video.types';
import { useAppTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';

export default function TutorialesScreen() {
  const { isDark, colors } = useAppTheme();

  const [tutoriales, setTutoriales] = useState<Tutorial[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [grupoSel, setGrupoSel] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [videoState, setVideoState] = useState<{ index: number } | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const bgColor = useScreenBackground();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  // Cargar grupos al inicio
  useEffect(() => {
    tutorialesService.getGrupos().then(setGrupos).catch(() => {});
  }, []);

  const loadTutoriales = useCallback(
    async (reset = true) => {
      const currentSkip = reset ? 0 : skip;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await tutorialesService.getTutoriales(
          currentSkip,
          TUTORIALES_PAGE_SIZE,
          debouncedSearch,
          grupoSel
        );
        setTotal(res.total);
        setSkip(currentSkip + res.items.length);
        setTutoriales((prev) => (reset ? res.items : [...prev, ...res.items]));
      } catch (error) {
        console.error('Error loading tutoriales:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [skip, debouncedSearch, grupoSel]
  );

  // Recargar cuando cambian filtros
  useEffect(() => {
    setSkip(0);
    loadTutoriales(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, grupoSel]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSkip(0);
    loadTutoriales(true);
  }, [loadTutoriales]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && !loading && tutoriales.length < total) {
      loadTutoriales(false);
    }
  }, [loadingMore, loading, tutoriales.length, total, loadTutoriales]);

  const handleOpenVideo = useCallback((tutorial: Tutorial) => {
    if (tutorial.embedUrl || tutorial.videoUrl) {
      const index = tutoriales.findIndex((t) => t.id === tutorial.id);
      setVideoState({ index: index >= 0 ? index : 0 });
    }
  }, [tutoriales]);

  const videoFeedItems: VideoFeedItem[] = useMemo(
    () =>
      tutoriales.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        instructor: t.instructor,
        videoUrl: t.videoUrl,
        embedUrl: t.embedUrl,
        videoId: t.id,
        thumbnail: t.thumbnail,
      })),
    [tutoriales]
  );

  const renderTutorial = useCallback(
    ({ item }: { item: Tutorial }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
        onPress={() => handleOpenVideo(item)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <MaterialCommunityIcons name="video-off" size={32} color={palette.slate400} />
            </View>
          )}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <MaterialCommunityIcons name="play" size={28} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="account-tie" size={14} color={textSecondary} />
            <Text style={[styles.cardInstructor, { color: textSecondary }]}>
              {item.instructor}
            </Text>
          </View>
          {item.grupos.length > 0 && (
            <View style={styles.gruposRow}>
              {item.grupos.slice(0, 3).map((grupo, i) => (
                <View key={i} style={[styles.grupoTag, { backgroundColor: `${palette.primary}15` }]}>
                  <Text style={styles.grupoTagText}>{grupo}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    [cardBg, borderColor, textPrimary, textSecondary, handleOpenVideo]
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Búsqueda */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
          <TextInput
            placeholder="Buscar tutoriales"
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de grupo */}
        {grupos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gruposFilter}
          >
            <TouchableOpacity
              style={[
                styles.grupoChip,
                {
                  backgroundColor: grupoSel === '' ? palette.primary : cardBg,
                  borderColor: grupoSel === '' ? palette.primary : borderColor,
                },
              ]}
              onPress={() => setGrupoSel('')}
            >
              <Text
                style={[styles.grupoChipText, { color: grupoSel === '' ? '#FFFFFF' : textSecondary }]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {grupos.map((grupo) => {
              const isActive = grupoSel === grupo;
              return (
                <TouchableOpacity
                  key={grupo}
                  style={[
                    styles.grupoChip,
                    {
                      backgroundColor: isActive ? palette.primary : cardBg,
                      borderColor: isActive ? palette.primary : borderColor,
                    },
                  ]}
                  onPress={() => setGrupoSel(grupo)}
                >
                  <Text
                    style={[styles.grupoChipText, { color: isActive ? '#FFFFFF' : textSecondary }]}
                  >
                    {grupo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <Loader fullscreen message="Cargando tutoriales..." />
      ) : (
        <FlatList
          data={tutoriales}
          renderItem={renderTutorial}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[palette.primary]}
              tintColor={palette.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={palette.primary} style={styles.footerLoader} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="video-off"
              title="Sin tutoriales"
              message="No se encontraron videos con los filtros aplicados"
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={8}
          initialNumToRender={6}
        />
      )}
      <VideoPlayerModal
        visible={videoState !== null}
        items={videoFeedItems}
        initialIndex={videoState?.index ?? 0}
        onClose={() => setVideoState(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  gruposFilter: {
    paddingVertical: 12,
    gap: 8,
  },
  grupoChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  grupoChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cardInstructor: {
    fontSize: 13,
  },
  gruposRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  grupoTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  grupoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.primary,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
