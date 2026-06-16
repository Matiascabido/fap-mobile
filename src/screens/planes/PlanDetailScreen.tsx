import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { PlanWithRelations, PlanEjercicioItem } from '../../types/planes.types';
import { PlanesStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { AddBloqueModal, AddEjercicioModal } from '../../components/planes/PlanManageModals';
import { palette } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ListRow from '../../components/common/ListRow';
import { normalizeBloques, getEjercicioNombre } from '../../utils/planBloques';
import { hapticSelection } from '../../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanDetailRouteProp = RouteProp<PlanesStackParamList, 'PlanDetail'>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function PlanDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlanDetailRouteProp>();
  const { isDark, colors } = useAppTheme();
  const { canManagePlanes } = usePermissions();

  const { planId } = route.params;

  const [planData, setPlanData] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBloques, setExpandedBloques] = useState<Set<string>>(new Set());
  const [showAddBloque, setShowAddBloque] = useState(false);
  const [ejercicioTarget, setEjercicioTarget] = useState<{ planBloqueId: string; nombre: string } | null>(
    null
  );

  const canManage = canManagePlanes();

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      const found = await planesService.getById(planId);
      setPlanData(found);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useLayoutEffect(() => {
    if (!planData?.plan) return;
    const plan = planData.plan;
    navigation.setOptions({
      title: plan.nombre_plan,
      headerRight: canManage
        ? () => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PlanForm', {
                  planId: plan.id,
                  initialNombre: plan.nombre_plan,
                  initialDescripcion: plan.descripcion ?? '',
                  initialSemanas: plan.semanas,
                  initialObjetivo: plan.objetivo_semanal ?? '',
                  initialTipoPlanId: plan.id_tipo_plan ?? plan.tipo_plan?.id ?? '',
                })
              }
              style={{ marginRight: 8, padding: 4 }}
            >
              <Ionicons name="create-outline" size={22} color={colors.tint} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, planData, canManage, colors.tint]);

  const toggleBloque = (bloqueId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBloques((prev) => {
      const next = new Set(prev);
      if (next.has(bloqueId)) next.delete(bloqueId);
      else next.add(bloqueId);
      return next;
    });
  };

  if (loading) {
    return <Loader fullscreen message="Cargando plan..." />;
  }

  if (!planData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
        <EmptyState icon="alert-circle-outline" title="Plan no encontrado" />
      </View>
    );
  }

  const plan = planData.plan;
  const asignacion = planData.asignaciones?.[0];
  const isActive = planData.activo ?? planData.asignaciones?.some((a) => a.activo) ?? false;
  const bloques = normalizeBloques(planData);

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="grouped" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={[styles.planName, { color: textPrimary }]}>{plan.nombre_plan}</Text>
            <Badge label={isActive ? 'Activo' : 'Finalizado'} variant={isActive ? 'success' : 'neutral'} />
          </View>
          {plan.descripcion ? (
            <Text style={[styles.planDesc, { color: textSecondary }]}>{plan.descripcion}</Text>
          ) : null}
          <View style={styles.infoMeta}>
            {plan.tipo_plan?.nombre_tipo ? (
              <MetaItem icon="tag" text={plan.tipo_plan.nombre_tipo} color={textSecondary} />
            ) : null}
            {plan.semanas ? (
              <MetaItem icon="calendar-range" text={`${plan.semanas} semanas`} color={textSecondary} />
            ) : null}
            {asignacion?.nombre_socio ? (
              <MetaItem icon="account" text={asignacion.nombre_socio} color={textSecondary} />
            ) : null}
          </View>
          {plan.objetivo_semanal ? (
            <View style={[styles.objetivoBox, { borderColor }]}>
              <Text style={[styles.objetivoLabel, { color: textSecondary }]}>Objetivo semanal</Text>
              <Text style={[styles.objetivoText, { color: textPrimary }]}>{plan.objetivo_semanal}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Bloques de entrenamiento</Text>
          {canManage ? (
            <TouchableOpacity style={styles.addLink} onPress={() => setShowAddBloque(true)}>
              <Ionicons name="add-circle" size={18} color={colors.tint} />
              <Text style={[styles.addLinkText, { color: colors.tint }]}>Agregar bloque</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {bloques.length === 0 ? (
          <Card variant="grouped">
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              Este plan todavía no tiene bloques cargados.
            </Text>
          </Card>
        ) : (
          bloques.map((bloque, index) => {
            const bloqueId = bloque.id || `bloque-${index}`;
            const planBloqueId = bloque.id_plan_bloque ?? bloque.id_fila_plan_bloque ?? '';
            const isExpanded = expandedBloques.has(bloqueId);
            const ejercicios = bloque.ejercicios || [];
            const diaNombre =
              bloque.dia_semana != null && bloque.dia_semana >= 0 && bloque.dia_semana <= 6
                ? DIAS_SEMANA[bloque.dia_semana]
                : null;

            return (
              <Card key={bloqueId} variant="grouped" style={styles.bloqueCard} padding={0}>
                <TouchableOpacity
                  style={styles.bloqueHeader}
                  onPress={() => toggleBloque(bloqueId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.bloqueColorDot, { backgroundColor: bloque.color || palette.primary }]}
                  />
                  <View style={styles.bloqueHeaderInfo}>
                    <Text style={[styles.bloqueNombre, { color: textPrimary }]}>{bloque.nombre}</Text>
                    <Text style={[styles.bloqueMeta, { color: textSecondary }]}>
                      {diaNombre ? `${diaNombre} · ` : ''}
                      {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.ejerciciosContainer, { borderTopColor: borderColor }]}>
                    {ejercicios.length === 0 ? (
                      <View style={styles.emptyBlock}>
                        <Text style={[styles.emptyText, { color: textSecondary }]}>
                          Sin ejercicios en este bloque
                        </Text>
                        {canManage && planBloqueId ? (
                          <TouchableOpacity
                            style={styles.addEjercicioBtn}
                            onPress={() =>
                              setEjercicioTarget({ planBloqueId, nombre: bloque.nombre })
                            }
                          >
                            <Ionicons name="add" size={16} color={colors.tint} />
                            <Text style={[styles.addEjercicioText, { color: colors.tint }]}>
                              Agregar primer ejercicio
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        {canManage && !planBloqueId ? (
                          <Text style={[styles.warnText, { color: palette.warning }]}>
                            No se pudo identificar el bloque. Recargá el plan.
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      ejercicios.map((ej, ejIndex) => (
                        <EjercicioRow
                          key={ej.id || `ej-${ejIndex}`}
                          ejercicio={ej}
                          isLast={ejIndex === ejercicios.length - 1 && !canManage}
                          onPress={() => {
                            hapticSelection();
                            navigation.navigate('PlanEjercicioDetail', {
                              planId,
                              planBloqueId: planBloqueId || undefined,
                              bloqueNombre: bloque.nombre,
                              ejercicio: ej,
                            });
                          }}
                        />
                      ))
                    )}
                    {canManage && planBloqueId && ejercicios.length > 0 ? (
                      <TouchableOpacity
                        style={styles.addEjercicioBtn}
                        onPress={() => setEjercicioTarget({ planBloqueId, nombre: bloque.nombre })}
                      >
                        <Ionicons name="add" size={16} color={colors.tint} />
                        <Text style={[styles.addEjercicioText, { color: colors.tint }]}>
                          Agregar ejercicio
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {canManage && !planBloqueId && ejercicios.length > 0 ? (
                      <Text style={[styles.warnText, { color: palette.warning }]}>
                        No se pudo identificar el bloque para agregar ejercicios.
                      </Text>
                    ) : null}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      <AddBloqueModal
        visible={showAddBloque}
        planId={planId}
        onClose={() => setShowAddBloque(false)}
        onSaved={loadPlan}
      />
      {ejercicioTarget ? (
        <AddEjercicioModal
          visible={Boolean(ejercicioTarget)}
          planId={planId}
          planBloqueId={ejercicioTarget.planBloqueId}
          bloqueNombre={ejercicioTarget.nombre}
          onClose={() => setEjercicioTarget(null)}
          onSaved={loadPlan}
        />
      ) : null}
    </View>
  );
}

function MetaItem({ icon, text, color }: { icon: any; text: string; color: string }) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.metaText, { color }]}>{text}</Text>
    </View>
  );
}

function EjercicioRow({
  ejercicio,
  isLast,
  onPress,
}: {
  ejercicio: PlanEjercicioItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const nombre = getEjercicioNombre(ejercicio);
  const stats = [
    ejercicio.series ? `Series ${ejercicio.series}` : null,
    ejercicio.reps ? `Reps ${ejercicio.reps}` : null,
    ejercicio.peso ? `Peso ${ejercicio.peso}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      title={nombre}
      subtitle={stats || undefined}
      onPress={onPress}
      icon="barbell-outline"
      isLast={isLast}
      detail={ejercicio.id_video ? 'Video' : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoCard: { marginBottom: 20 },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 12 },
  planDesc: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  infoMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  objetivoBox: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  objetivoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  objetivoText: { fontSize: 15, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { fontSize: 14, fontWeight: '600' },
  addEjercicioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addEjercicioText: { fontSize: 14, fontWeight: '600' },
  bloqueCard: { marginBottom: 12, overflow: 'hidden' },
  bloqueHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  bloqueColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  bloqueHeaderInfo: { flex: 1 },
  bloqueNombre: { fontSize: 17, fontWeight: '600' },
  bloqueMeta: { fontSize: 13, marginTop: 2 },
  ejerciciosContainer: { borderTopWidth: StyleSheet.hairlineWidth },
  emptyBlock: { paddingVertical: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  warnText: { fontSize: 12, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 12 },
});
