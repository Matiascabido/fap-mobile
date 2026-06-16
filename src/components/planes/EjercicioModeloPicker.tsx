import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { ejerciciosService, EjercicioModelo } from '../../services/api/ejercicios.service';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import {
  buildCreateFromEjercicioModelo,
  ejercicioIdFromCreateResponse,
} from '../../utils/planEjercicioClone';
import { videoFeedItemFromApiRecord } from '../../utils/exerciseVideo';
import { VideoFeedItem } from '../../types/video.types';
import TutorialVideoCard from '../video/TutorialVideoCard';
import VideoPlayerModal from '../common/VideoPlayerModal';

const PAGE = 50;
const FIELD_MAX = 100;

interface CargaEjercicio {
  series: string;
  reps: string;
  peso: string;
  descripcion: string;
  observaciones: string;
  rpe: string;
  rir: string;
  ce: string;
  pausaDesde: string;
  pausaHasta: string;
}

const EMPTY_CARGA: CargaEjercicio = {
  series: '',
  reps: '',
  peso: '',
  descripcion: '',
  observaciones: '',
  rpe: '',
  rir: '',
  ce: '',
  pausaDesde: '',
  pausaHasta: '',
};

function thumbnailFromModelo(modelo: EjercicioModelo): string | null {
  const v = modelo.video;
  if (v && typeof v === 'object') {
    const t = (v as Record<string, unknown>).thumbnail;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  return null;
}

function videoFromModelo(modelo: EjercicioModelo): VideoFeedItem | null {
  if (modelo.video && typeof modelo.video === 'object') {
    return videoFeedItemFromApiRecord(modelo.video, modelo.nombre, undefined, modelo.id);
  }
  if (modelo.id_video) {
    return videoFeedItemFromApiRecord(
      { id: modelo.id_video, title: modelo.nombre },
      modelo.nombre,
      undefined,
      modelo.id
    );
  }
  return null;
}

function defaultsFromModelo(modelo: EjercicioModelo): CargaEjercicio {
  return {
    series: modelo.serie?.trim() ?? '',
    reps: modelo.repeticion?.trim() ?? '',
    peso: modelo.peso?.trim() ?? '',
    descripcion: modelo.descripcion?.trim() ?? '',
    observaciones: '',
    rpe: modelo.rpe?.trim() ?? '',
    rir: modelo.rir?.trim() ?? '',
    ce: modelo.ce?.trim() ?? '',
    pausaDesde: modelo.pausa_desde?.trim() ?? '',
    pausaHasta: modelo.pausa_hasta?.trim() ?? '',
  };
}

async function clonarYVincularEjercicio(
  planId: string,
  planBloqueId: string,
  modelo: EjercicioModelo,
  carga: CargaEjercicio
): Promise<boolean> {
  const body = buildCreateFromEjercicioModelo(modelo, {
    serie: carga.series,
    repeticion: carga.reps,
    peso: carga.peso,
    descripcion: carga.descripcion,
    observaciones: carga.observaciones,
    rpe: carga.rpe,
    rir: carga.rir,
    ce: carga.ce,
    pausa_desde: carga.pausaDesde,
    pausa_hasta: carga.pausaHasta,
  });
  const created = await ejerciciosService.create(body);
  const newId = ejercicioIdFromCreateResponse(created);
  if (!newId) return false;
  await planesService.addEjercicioToBloque(planId, planBloqueId, { id_ejercicio: newId });
  return true;
}

function ConfigurarModeloModal({
  visible,
  modelo,
  initialCarga,
  loading,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  modelo: EjercicioModelo | null;
  initialCarga: CargaEjercicio;
  loading: boolean;
  onClose: () => void;
  onConfirm: (carga: CargaEjercicio) => void;
}) {
  const { isDark } = useTheme();
  const [carga, setCarga] = useState<CargaEjercicio>(initialCarga);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (visible) setCarga(initialCarga);
  }, [visible, initialCarga]);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const groupedBg = isDark ? palette.darkBg : '#F2F2F7';

  if (!modelo) return null;

  const videoItem = videoFromModelo(modelo);

  const setField = (key: keyof CargaEjercicio, value: string) =>
    setCarga((prev) => ({ ...prev, [key]: value.slice(0, FIELD_MAX) }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.configOverlay}
      >
        <View style={[styles.configSheet, { backgroundColor: bgColor }]}>
          <View style={styles.configHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.configTitle, { color: textPrimary }]}>Configurar ejercicio</Text>
              <Text style={[styles.configSubtitle, { color: textSecondary }]} numberOfLines={2}>
                {modelo.nombre}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialCommunityIcons name="close" size={22} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.configBody} keyboardShouldPersistTaps="handled">
            {videoItem ? (
              <View style={styles.videoSection}>
                <TutorialVideoCard item={videoItem} onPress={() => setShowVideo(true)} />
              </View>
            ) : null}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Series *</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.series}
                  onChangeText={(v) => setField('series', v)}
                  placeholder="Ej: 3-4"
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Reps *</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.reps}
                  onChangeText={(v) => setField('reps', v)}
                  placeholder="Ej: 8-12"
                  placeholderTextColor={textSecondary}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Peso</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
              value={carga.peso}
              onChangeText={(v) => setField('peso', v)}
              placeholder="Ej: 80 kg"
              placeholderTextColor={textSecondary}
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>RPE</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.rpe}
                  onChangeText={(v) => setField('rpe', v)}
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>RIR</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.rir}
                  onChangeText={(v) => setField('rir', v)}
                  placeholderTextColor={textSecondary}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>C.E.</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
              value={carga.ce}
              onChangeText={(v) => setField('ce', v)}
              placeholderTextColor={textSecondary}
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Pausa desde</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.pausaDesde}
                  onChangeText={(v) => setField('pausaDesde', v)}
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Pausa hasta</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
                  value={carga.pausaHasta}
                  onChangeText={(v) => setField('pausaHasta', v)}
                  placeholderTextColor={textSecondary}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Descripción / objetivo</Text>
            <TextInput
              style={[styles.fieldInputMultiline, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
              value={carga.descripcion}
              onChangeText={(v) => setField('descripcion', v)}
              multiline
              placeholderTextColor={textSecondary}
            />

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Observaciones</Text>
            <TextInput
              style={[styles.fieldInputMultiline, { borderColor, color: textPrimary, backgroundColor: groupedBg }]}
              value={carga.observaciones}
              onChangeText={(v) => setField('observaciones', v)}
              multiline
              placeholderTextColor={textSecondary}
            />
          </ScrollView>

          <View style={styles.configFooter}>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Text style={{ color: textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              disabled={loading}
              onPress={() => {
                if (!carga.series.trim() || !carga.reps.trim()) {
                  Alert.alert('Error', 'Completá series y repeticiones.');
                  return;
                }
                onConfirm(carga);
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Agregar al bloque</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <VideoPlayerModal
        visible={showVideo && Boolean(videoItem)}
        items={videoItem ? [videoItem] : []}
        onClose={() => setShowVideo(false)}
      />
    </Modal>
  );
}

export function EjercicioModeloPicker({
  planId,
  planBloqueId,
  bloqueNombre,
  required,
  onCancel,
  onSaved,
}: {
  planId: string;
  planBloqueId: string;
  bloqueNombre?: string;
  required?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { isDark } = useTheme();
  const [modelos, setModelos] = useState<EjercicioModelo[]>([]);
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [configModelo, setConfigModelo] = useState<EjercicioModelo | null>(null);
  const [configCarga, setConfigCarga] = useState<CargaEjercicio>(EMPTY_CARGA);

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const groupedBg = isDark ? palette.darkBg : '#F2F2F7';

  const loadPage = useCallback(async (reset = false) => {
    const nextSkip = reset ? 0 : skip;
    if (reset) setLoadingList(true);
    else setLoadingMore(true);
    try {
      const batch = await ejerciciosService.getModelos(nextSkip, PAGE);
      setModelos((prev) => (reset ? batch : [...prev, ...batch]));
      setSkip(nextSkip + batch.length);
      setHasMore(batch.length >= PAGE);
    } catch {
      if (reset) setModelos([]);
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  }, [skip]);

  useEffect(() => {
    loadPage(true);
  }, []);

  const filtered = modelos.filter((e) =>
    e.nombre.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleCancel = () => {
    if (required) {
      Alert.alert(
        'Ejercicio obligatorio',
        'Tenés que agregar al menos un ejercicio al bloque. Si cancelás, se eliminará el bloque vacío.',
        [
          { text: 'Seguir eligiendo', style: 'cancel' },
          { text: 'Eliminar bloque', style: 'destructive', onPress: onCancel },
        ]
      );
      return;
    }
    onCancel();
  };

  const abrirConfigurar = (modelo: EjercicioModelo) => {
    setConfigCarga(defaultsFromModelo(modelo));
    setConfigModelo(modelo);
  };

  const confirmarAgregar = async (carga: CargaEjercicio) => {
    if (!configModelo) return;
    setLoading(true);
    try {
      const ok = await clonarYVincularEjercicio(planId, planBloqueId, configModelo, carga);
      if (!ok) {
        Alert.alert('Error', 'El servidor no devolvió el id del ejercicio creado.');
        return;
      }
      setConfigModelo(null);
      Alert.alert('Éxito', 'Ejercicio agregado al bloque.');
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo agregar el ejercicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.sheetHandle} />
      <Text style={[styles.sheetTitle, { color: textPrimary }]}>
        {required ? 'Agregá un ejercicio' : 'Agregar ejercicio'}
        {bloqueNombre ? ` · ${bloqueNombre}` : ''}
      </Text>
      {required ? (
        <Text style={[styles.stepHint, { color: textSecondary }]}>
          Elegí un ejercicio del catálogo, mirá el video y configurá la carga.
        </Text>
      ) : null}

      <TextInput
        style={[styles.input, { borderColor, color: textPrimary, marginBottom: 8, backgroundColor: groupedBg }]}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nombre..."
        placeholderTextColor={textSecondary}
      />

      {loadingList ? (
        <ActivityIndicator color={palette.primary} style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView
          style={{ maxHeight: 420 }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (
              hasMore &&
              !loadingMore &&
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 40
            ) {
              loadPage(false);
            }
          }}
          scrollEventThrottle={200}
        >
          <View style={styles.grid}>
            {filtered.map((mod) => {
              const thumb = thumbnailFromModelo(mod);
              const hasVideo = Boolean(videoFromModelo(mod));
              return (
                <View
                  key={mod.id}
                  style={[styles.modeloCard, { borderColor, backgroundColor: groupedBg }]}
                >
                  <TouchableOpacity
                    style={styles.thumbWrap}
                    onPress={() => abrirConfigurar(mod)}
                    activeOpacity={0.85}
                  >
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <MaterialCommunityIcons
                          name={hasVideo ? 'play-circle-outline' : 'dumbbell'}
                          size={28}
                          color={textSecondary}
                        />
                      </View>
                    )}
                    {hasVideo ? (
                      <View style={styles.thumbPlay}>
                        <MaterialCommunityIcons name="play" size={16} color="#FFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                  <Text style={[styles.modeloNombre, { color: textPrimary }]} numberOfLines={2}>
                    {mod.nombre}
                  </Text>
                  <TouchableOpacity style={styles.agregarBtn} onPress={() => abrirConfigurar(mod)}>
                    <Text style={styles.agregarBtnText}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          {filtered.length === 0 ? (
            <Text style={{ color: textSecondary, textAlign: 'center', marginVertical: 16 }}>
              No hay ejercicios que coincidan con la búsqueda.
            </Text>
          ) : null}
          {loadingMore ? (
            <ActivityIndicator color={palette.primary} style={{ marginVertical: 12 }} />
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleCancel} disabled={loading}>
          <Text style={{ color: textSecondary }}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <ConfigurarModeloModal
        visible={Boolean(configModelo)}
        modelo={configModelo}
        initialCarga={configCarga}
        loading={loading}
        onClose={() => !loading && setConfigModelo(null)}
        onConfirm={confirmarAgregar}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  stepHint: { fontSize: 13, marginTop: -8, marginBottom: 12, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 8,
  },
  modeloCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  thumbWrap: { position: 'relative', marginBottom: 8 },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 10,
  },
  thumbPlaceholder: {
    backgroundColor: 'rgba(100,116,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeloNombre: { fontSize: 13, fontWeight: '700', minHeight: 36, marginBottom: 6 },
  agregarBtn: {
    backgroundColor: palette.slate800,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  agregarBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  submitText: { color: '#FFF', fontWeight: '700' },
  configOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  configSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  configTitle: { fontSize: 18, fontWeight: '800' },
  configSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  configBody: { paddingHorizontal: 12, maxHeight: 480 },
  videoSection: { marginBottom: 4 },
  fieldRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, marginTop: 4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 4,
  },
  fieldInputMultiline: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  configFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
