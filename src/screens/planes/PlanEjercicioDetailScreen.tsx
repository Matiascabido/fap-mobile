import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { PlanesStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { typography } from '../../theme/iosTheme';
import GroupedSection from '../../components/common/GroupedSection';
import ListRow from '../../components/common/ListRow';
import EditableExerciseField from '../../components/planes/EditableExerciseField';
import { getEjercicioNombre } from '../../utils/planBloques';
import { ejerciciosService } from '../../services/api/ejercicios.service';
import { VideoFeedItem } from '../../types/video.types';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';
import TutorialVideoCard from '../../components/video/TutorialVideoCard';
import {
  ejercicioPuedeTenerVideo,
  resolveExerciseVideoFeedItem,
  videoFeedItemFromEjercicio,
} from '../../utils/exerciseVideo';
import { planEjercicioToDisplay } from '../../utils/planEjercicioDisplay';
import {
  prescriptionRowsForDisplay,
  otherDetailRowsForDisplay,
} from '../../utils/planExerciseDetailRows';
import {
  EDITABLE_FIELD_BY_LABEL,
  PRIMARY_PRESCRIPTION_LABELS,
  EXTRA_PRESCRIPTION_LABELS,
  displayValueForField,
  resolveCatalogEjercicioId,
} from '../../utils/ejercicioEditFields';

type Route = RouteProp<PlanesStackParamList, 'PlanEjercicioDetail'>;

const ALL_EDITABLE_PRESCRIPTION = [...PRIMARY_PRESCRIPTION_LABELS, ...EXTRA_PRESCRIPTION_LABELS];

export default function PlanEjercicioDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useAppTheme();
  const { canManagePlanes } = usePermissions();
  const canEdit = canManagePlanes();
  const { ejercicio, bloqueNombre } = route.params;

  const nombre = getEjercicioNombre(ejercicio);
  const puedeTenerVideo = ejercicioPuedeTenerVideo(ejercicio);

  const [loadingDetail, setLoadingDetail] = useState(Boolean(ejercicio.id_ejercicio));
  const [display, setDisplay] = useState<Record<string, unknown>>(() =>
    planEjercicioToDisplay(ejercicio)
  );
  const [videoFeedItem, setVideoFeedItem] = useState<VideoFeedItem | null>(() =>
    videoFeedItemFromEjercicio(ejercicio, nombre, bloqueNombre)
  );
  const [loadingVideo, setLoadingVideo] = useState(puedeTenerVideo);
  const [videoError, setVideoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const ejercicioId = useMemo(
    () => resolveCatalogEjercicioId(ejercicio, display),
    [ejercicio, display]
  );

  const reloadDetail = useCallback(async () => {
    if (!ejercicioId) return;
    const found = await ejerciciosService.getById(ejercicioId);
    if (found) setDisplay(planEjercicioToDisplay(ejercicio, found));
  }, [ejercicio, ejercicioId]);

  useEffect(() => {
    navigation.setOptions({ title: nombre });
  }, [navigation, nombre]);

  useEffect(() => {
    const id = ejercicio.id_ejercicio;
    if (!id) {
      setLoadingDetail(false);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    ejerciciosService
      .getById(String(id))
      .then((found) => {
        if (cancelled) return;
        setDisplay(planEjercicioToDisplay(ejercicio, found));
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ejercicio]);

  useEffect(() => {
    if (!puedeTenerVideo) {
      setLoadingVideo(false);
      return;
    }

    let cancelled = false;
    setLoadingVideo(true);
    setVideoError(false);

    resolveExerciseVideoFeedItem(ejercicio, nombre, bloqueNombre)
      .then((item) => {
        if (cancelled) return;
        setVideoFeedItem(item);
        setVideoError(!item);
      })
      .catch(() => {
        if (!cancelled) setVideoError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingVideo(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ejercicio, nombre, bloqueNombre, puedeTenerVideo]);

  const prescriptionRows = useMemo(() => prescriptionRowsForDisplay(display), [display]);
  const otherRows = useMemo(
    () =>
      otherDetailRowsForDisplay(display).filter(
        (r) => r.label !== 'Observaciones' || !canEdit
      ),
    [display, canEdit]
  );
  const descripcion =
    typeof display.descripcion === 'string' && display.descripcion.trim()
      ? display.descripcion.trim()
      : '';

  const renderEditablePrescription = () => (
    <GroupedSection title="Prescripción">
      {canEdit && !ejercicioId ? (
        <View style={styles.hintBox}>
          <Text style={[styles.hintText, { color: colors.secondaryLabel }]}>
            No se pudo identificar el ejercicio en el catálogo para editarlo.
          </Text>
        </View>
      ) : null}
      {ALL_EDITABLE_PRESCRIPTION.map((label, index) => {
        const fieldName = EDITABLE_FIELD_BY_LABEL[label];
        if (!fieldName) return null;
        return (
          <EditableExerciseField
            key={label}
            label={label}
            value={displayValueForField(display, fieldName)}
            fieldName={fieldName}
            ejercicioId={canEdit ? ejercicioId : null}
            editable={canEdit}
            isLast={index === ALL_EDITABLE_PRESCRIPTION.length - 1}
            editingKey={editingKey}
            onEditStart={setEditingKey}
            onEditEnd={() => setEditingKey(null)}
            onSaved={() => void reloadDetail()}
          />
        );
      })}
    </GroupedSection>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {bloqueNombre ? (
        <Text style={[styles.contextLabel, { color: colors.secondaryLabel }]}>
          {bloqueNombre}
        </Text>
      ) : null}

      <Text style={[styles.heroTitle, typography.title2, { color: colors.label }]}>{nombre}</Text>

      {canEdit ? (
        <Text style={[styles.editHint, { color: colors.secondaryLabel }]}>
          Tocá un campo para editar series, repeticiones, peso u otros datos.
        </Text>
      ) : null}

      {loadingDetail ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.tint} />
          <Text style={[styles.loadingHint, { color: colors.secondaryLabel }]}>
            Cargando detalle…
          </Text>
        </View>
      ) : null}

      {canEdit ? (
        renderEditablePrescription()
      ) : prescriptionRows.length > 0 ? (
        <GroupedSection title="Prescripción">
          {prescriptionRows.map((row, index) => (
            <ListRow
              key={row.label}
              title={row.label}
              detail={row.value}
              isLast={index === prescriptionRows.length - 1}
            />
          ))}
        </GroupedSection>
      ) : null}

      {canEdit ? (
        <GroupedSection title="Observaciones">
          <EditableExerciseField
            label="Observaciones"
            value={displayValueForField(display, 'observaciones')}
            fieldName="observaciones"
            ejercicioId={ejercicioId}
            editable={canEdit}
            multiline
            placeholder="Sin observaciones"
            isLast
            editingKey={editingKey}
            onEditStart={setEditingKey}
            onEditEnd={() => setEditingKey(null)}
            onSaved={() => void reloadDetail()}
          />
        </GroupedSection>
      ) : otherRows.length > 0 ? (
        <GroupedSection title="Detalle">
          {otherRows.map((row, index) => (
            <ListRow
              key={row.label}
              title={row.label}
              detail={row.value}
              isLast={index === otherRows.length - 1}
            />
          ))}
        </GroupedSection>
      ) : null}

      {puedeTenerVideo ? (
        <GroupedSection title="Video tutorial">
          {loadingVideo ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.loadingHint, { color: colors.secondaryLabel }]}>
                Cargando video…
              </Text>
            </View>
          ) : videoFeedItem ? (
            <TutorialVideoCard item={videoFeedItem} onPress={() => setShowVideo(true)} />
          ) : (
            <View style={styles.descBox}>
              <Text style={[styles.descText, { color: colors.secondaryLabel }]}>
                {videoError
                  ? 'No se pudo cargar el video. Verificá tu conexión e intentá de nuevo.'
                  : 'No hay video disponible para este ejercicio.'}
              </Text>
            </View>
          )}
        </GroupedSection>
      ) : null}

      <GroupedSection title="Descripción">
        {canEdit ? (
          <EditableExerciseField
            label="Descripción"
            value={descripcion}
            fieldName="descripcion"
            ejercicioId={ejercicioId}
            editable={canEdit}
            multiline
            placeholder="Sin descripción"
            isLast
            editingKey={editingKey}
            onEditStart={setEditingKey}
            onEditEnd={() => setEditingKey(null)}
            onSaved={() => void reloadDetail()}
          />
        ) : (
          <View style={styles.descBox}>
            <Text style={[styles.descText, { color: colors.label }]}>
              {descripcion || 'Sin descripción disponible para este ejercicio.'}
            </Text>
          </View>
        )}
      </GroupedSection>

      <VideoPlayerModal
        visible={showVideo && Boolean(videoFeedItem)}
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
  heroTitle: { marginBottom: 8, marginLeft: 4 },
  editHint: { fontSize: 13, marginBottom: 16, marginLeft: 4, lineHeight: 18 },
  hintBox: { paddingHorizontal: 16, paddingBottom: 8 },
  hintText: { fontSize: 13, lineHeight: 18 },
  loadingRow: { padding: 24, alignItems: 'center', gap: 8 },
  loadingHint: { fontSize: 13 },
  descBox: { padding: 16 },
  descText: { fontSize: 17, lineHeight: 24 },
});
