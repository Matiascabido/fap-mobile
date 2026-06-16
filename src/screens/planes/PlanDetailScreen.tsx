import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { planesService } from '../../services/api/planes.service';
import { PlanWithRelations, PlanEjercicioItem, Bloque } from '../../types/planes.types';
import { PlanesStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { AddBloqueModal, AddEjercicioModal } from '../../components/planes/PlanManageModals';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { normalizeBloques, getEjercicioNombre, filterListableEjercicios, referencePlanBloqueId } from '../../utils/planBloques';
import { planEjercicioToDisplay } from '../../utils/planEjercicioDisplay';
import { compactStatsFromDisplay } from '../../utils/planExerciseDetailRows';
import { resolveBlockColor } from '../../utils/planBlockColors';
import {
  resolveBloquesAgrupados,
  tituloGrupoDiaSemana,
  diaGrupoKey,
  planMostrarAgrupacionPorDia,
} from '../../utils/planDiasSemana';
import { hapticSelection } from '../../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanDetailRouteProp = RouteProp<PlanesStackParamList, 'PlanDetail'>;

function MetaField({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.metaField}>
      <Text style={[styles.metaFieldLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <Text style={[styles.metaFieldValue, { color: colors.label }]}>{value}</Text>
    </View>
  );
}

function EjercicioRow({
  ejercicio,
  stripColor,
  onPress,
}: {
  ejercicio: PlanEjercicioItem;
  stripColor: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const nombre = getEjercicioNombre(ejercicio);
  const stats = compactStatsFromDisplay(planEjercicioToDisplay(ejercicio));
  const tieneVideo = Boolean(
    ejercicio.id_video ||
      ejercicio.ejercicio?.id_video ||
      ejercicio.ejercicio?.video ||
      ejercicio.ejercicio?.url_youtube
  );

  return (
    <TouchableOpacity
      style={[styles.ejercicioRow, { backgroundColor: colors.secondaryGroupedBackground, borderColor: colors.separator }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} style={styles.ejChevron} />
      <View style={[styles.ejStrip, { backgroundColor: stripColor }]} />
      <View style={styles.ejContent}>
        <Text style={[styles.ejTitle, { color: colors.label }]} numberOfLines={2}>
          {nombre}
        </Text>
        {stats ? (
          <Text style={[styles.ejStats, { color: colors.secondaryLabel }]} numberOfLines={1}>
            {stats}
          </Text>
        ) : null}
      </View>
      {tieneVideo ? (
        <View style={[styles.videoPill, { backgroundColor: `${colors.tint}14` }]}>
          <Ionicons name="play-circle" size={14} color={colors.tint} />
          <Text style={[styles.videoPillText, { color: colors.tint }]}>Video</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function DiaGrupoHeader({
  titulo,
  numBloques,
  numEjercicios,
  expanded,
  onToggle,
}: {
  titulo: string;
  numBloques: number;
  numEjercicios: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.diaHeader, { borderBottomColor: colors.separator }]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.secondaryLabel}
        style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
      />
      <Text style={[styles.diaHeaderTitle, { color: colors.label }]}>{titulo}</Text>
      <View style={[styles.diaCountPill, { backgroundColor: colors.tertiaryGroupedBackground }]}>
        <Text style={[styles.diaCountText, { color: colors.secondaryLabel }]}>
          {numBloques} {numBloques === 1 ? 'bloque' : 'bloques'}
        </Text>
      </View>
      {numEjercicios > 0 ? (
        <Text style={[styles.diaEjCount, { color: colors.secondaryLabel }]}>
          · {numEjercicios} ej.
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function BloqueCard({
  bloque,
  bloqueId,
  planBloqueId,
  isExpanded,
  canManage,
  onToggle,
  onAddEjercicio,
  onEjercicioPress,
}: {
  bloque: Bloque;
  bloqueId: string;
  planBloqueId: string;
  isExpanded: boolean;
  canManage: boolean;
  onToggle: () => void;
  onAddEjercicio: () => void;
  onEjercicioPress: (ej: PlanEjercicioItem) => void;
}) {
  const { colors } = useAppTheme();
  const stripColor = resolveBlockColor(bloque);
  const ejercicios = filterListableEjercicios(bloque.ejercicios);

  return (
    <View style={[styles.bloqueCard, { borderColor: colors.separator }]}>
      <TouchableOpacity
        style={[styles.bloqueHeader, { backgroundColor: stripColor }]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color="rgba(255,255,255,0.95)"
          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
        />
        <View style={styles.bloqueHeaderDot} />
        <View style={styles.bloqueHeaderInfo}>
          <Text style={styles.bloqueNombre} numberOfLines={2}>
            {bloque.nombre}
          </Text>
          {bloque.observaciones?.trim() ? (
            <Text style={styles.bloqueObs} numberOfLines={1}>
              {bloque.observaciones}
            </Text>
          ) : null}
          <Text style={styles.bloqueCount}>
            {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={[styles.ejerciciosWrap, { backgroundColor: colors.tertiaryGroupedBackground }]}>
          {ejercicios.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
                Sin ejercicios en este bloque
              </Text>
              {canManage && planBloqueId ? (
                <TouchableOpacity style={styles.addEjercicioBtn} onPress={onAddEjercicio}>
                  <Ionicons name="add" size={16} color={colors.tint} />
                  <Text style={[styles.addEjercicioText, { color: colors.tint }]}>
                    Agregar primer ejercicio
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.ejList}>
              {ejercicios.map((ej, ejIndex) => (
                <EjercicioRow
                  key={ej.id || `ej-${ejIndex}`}
                  ejercicio={ej}
                  stripColor={stripColor}
                  onPress={() => {
                    hapticSelection();
                    onEjercicioPress(ej);
                  }}
                />
              ))}
            </View>
          )}
          {canManage && planBloqueId && ejercicios.length > 0 ? (
            <TouchableOpacity style={styles.addEjercicioBtn} onPress={onAddEjercicio}>
              <Ionicons name="add" size={16} color={colors.tint} />
              <Text style={[styles.addEjercicioText, { color: colors.tint }]}>Agregar ejercicio</Text>
            </TouchableOpacity>
          ) : null}
          {canManage && !planBloqueId ? (
            <Text style={[styles.warnText, { color: palette.warning }]}>
              No se pudo identificar el bloque. Recargá el plan.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function PlanDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlanDetailRouteProp>();
  const { colors } = useAppTheme();
  const { canManagePlanes } = usePermissions();

  const { planId } = route.params;

  const [planData, setPlanData] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBloques, setExpandedBloques] = useState<Set<string>>(new Set());
  const [expandedDias, setExpandedDias] = useState<Set<string>>(new Set());
  const [showAddBloque, setShowAddBloque] = useState(false);
  const [ejercicioTarget, setEjercicioTarget] = useState<{ planBloqueId: string; nombre: string } | null>(
    null
  );

  const canManage = canManagePlanes();

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
      headerTransparent: false,
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
                  initialObservaciones: plan.observaciones ?? '',
                  initialNumero: plan.numero,
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

  const toggleDia = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDias((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const bloques = useMemo(() => (planData ? normalizeBloques(planData) : []), [planData]);
  const bloquesPorDia = useMemo(
    () => (planData ? resolveBloquesAgrupados(planData) : []),
    [planData]
  );
  const mostrarAgrupacionPorDia = useMemo(
    () => (planData ? planMostrarAgrupacionPorDia(planData.bloques_por_dia, bloques) : false),
    [planData, bloques]
  );

  useEffect(() => {
    if (!mostrarAgrupacionPorDia) return;
    setExpandedDias(new Set(bloquesPorDia.map((g) => diaGrupoKey(g.dia_semana))));
  }, [mostrarAgrupacionPorDia, bloquesPorDia]);

  const didAutoExpandBloque = useRef(false);

  useEffect(() => {
    if (didAutoExpandBloque.current || bloques.length === 0) return;
    const firstConEj = bloques.find((b) => filterListableEjercicios(b.ejercicios).length > 0);
    if (firstConEj?.id) {
      setExpandedBloques(new Set([firstConEj.id]));
      didAutoExpandBloque.current = true;
    }
  }, [bloques]);
  const heroAccent = useMemo(
    () => resolveBlockColor(bloques[0] ?? null),
    [bloques]
  );

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
  const freq =
    plan.numero != null && String(plan.numero).trim() !== '' ? String(plan.numero).trim() : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
        <LinearGradient
          colors={['#243447', '#1B2838', heroAccent]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle} numberOfLines={3}>
            {plan.nombre_plan}
          </Text>
          <View style={styles.heroBadges}>
            {isActive ? (
              <View style={styles.heroActiveBadge}>
                <Text style={styles.heroActiveText}>Activo</Text>
              </View>
            ) : (
              <View style={styles.heroInactiveBadge}>
                <Text style={styles.heroInactiveText}>Finalizado</Text>
              </View>
            )}
            {plan.tipo_plan?.nombre_tipo ? (
              <View style={styles.heroTipoBadge}>
                <Text style={styles.heroTipoText}>{plan.tipo_plan.nombre_tipo}</Text>
              </View>
            ) : null}
            {freq ? (
              <View style={styles.heroTipoBadge}>
                <Text style={styles.heroTipoText}>{freq}× / sem</Text>
              </View>
            ) : null}
          </View>
          {asignacion?.nombre_socio ? (
            <View style={styles.heroSocioRow}>
              <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroSocioText} numberOfLines={1}>
                {asignacion.nombre_socio}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={[styles.metaGrid, { backgroundColor: colors.secondaryGroupedBackground, borderColor: colors.separator }]}>
          <MetaField label="Objetivo semanal" value={plan.objetivo_semanal?.trim() || 'No especificado'} />
          <View style={[styles.metaDivider, { backgroundColor: colors.separator }]} />
          <MetaField
            label="Observaciones"
            value={plan.observaciones?.trim() || 'Sin observaciones'}
          />
          {plan.descripcion?.trim() ? (
            <>
              <View style={[styles.metaDivider, { backgroundColor: colors.separator }]} />
              <MetaField label="Descripción" value={plan.descripcion.trim()} />
            </>
          ) : null}
          {plan.semanas ? (
            <>
              <View style={[styles.metaDivider, { backgroundColor: colors.separator }]} />
              <MetaField label="Duración" value={`${plan.semanas} semanas`} />
            </>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.secondaryLabel }]}>
              Rutina
            </Text>
            <Text style={[styles.sectionTitle, typography.title3, { color: colors.label }]}>
              Bloques y ejercicios
            </Text>
          </View>
          {canManage ? (
            <TouchableOpacity style={styles.addLink} onPress={() => setShowAddBloque(true)}>
              <Ionicons name="add-circle" size={20} color={colors.tint} />
              <Text style={[styles.addLinkText, { color: colors.tint }]}>Bloque</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {bloques.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.secondaryGroupedBackground, borderColor: colors.separator }]}>
            <Ionicons name="barbell-outline" size={32} color={colors.tertiaryLabel} />
            <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
              Este plan todavía no tiene bloques cargados.
            </Text>
          </View>
        ) : (
          bloquesPorDia.map((grupo) => {
            const grupoKey = diaGrupoKey(grupo.dia_semana);
            const diaExpanded = !mostrarAgrupacionPorDia || expandedDias.has(grupoKey);
            const ejerciciosEnGrupo = grupo.bloques.reduce(
              (n, b) => n + filterListableEjercicios(b.ejercicios).length,
              0
            );

            return (
              <View key={grupoKey} style={styles.diaGrupo}>
                {mostrarAgrupacionPorDia ? (
                  <DiaGrupoHeader
                    titulo={tituloGrupoDiaSemana(grupo.dia_semana, grupo.dia_semana_nombre)}
                    numBloques={grupo.bloques.length}
                    numEjercicios={ejerciciosEnGrupo}
                    expanded={diaExpanded}
                    onToggle={() => toggleDia(grupoKey)}
                  />
                ) : null}
                {diaExpanded
                  ? grupo.bloques.map((bloque, index) => {
                      const bloqueId = bloque.id || `${grupoKey}-bloque-${index}`;
                      const planBloqueId = referencePlanBloqueId(bloque) ?? '';
                      const isExpanded = expandedBloques.has(bloqueId);

                      return (
                        <BloqueCard
                          key={bloqueId}
                          bloque={bloque}
                          bloqueId={bloqueId}
                          planBloqueId={planBloqueId}
                          isExpanded={isExpanded}
                          canManage={canManage}
                          onToggle={() => toggleBloque(bloqueId)}
                          onAddEjercicio={() =>
                            setEjercicioTarget({ planBloqueId, nombre: bloque.nombre })
                          }
                          onEjercicioPress={(ej) =>
                            navigation.navigate('PlanEjercicioDetail', {
                              planId,
                              planBloqueId: planBloqueId || undefined,
                              bloqueNombre: bloque.nombre,
                              ejercicio: ej,
                            })
                          }
                        />
                      );
                    })
                  : null}
              </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.primary,
    lineHeight: 28,
    marginBottom: 10,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  heroActiveBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  heroActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6EE7B7',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroInactiveBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroInactiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
  },
  heroTipoBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroTipoText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  heroSocioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  heroSocioText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    flex: 1,
  },
  metaGrid: {
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  metaField: { paddingVertical: 4 },
  metaFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaFieldValue: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 21,
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {},
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  addLinkText: { fontSize: 14, fontWeight: '700' },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  bloqueCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bloqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  bloqueHeaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  bloqueHeaderInfo: { flex: 1, minWidth: 0 },
  bloqueNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  bloqueObs: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bloqueCount: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  ejerciciosWrap: {
    padding: 10,
    gap: 8,
  },
  ejList: { gap: 8 },
  ejercicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 8,
    gap: 8,
  },
  ejChevron: { marginLeft: 2 },
  ejStrip: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    minHeight: 36,
  },
  ejContent: { flex: 1, minWidth: 0 },
  ejTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  ejStats: { fontSize: 11, marginTop: 2 },
  videoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  videoPillText: { fontSize: 10, fontWeight: '700' },
  emptyBlock: { paddingVertical: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  addEjercicioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  addEjercicioText: { fontSize: 14, fontWeight: '600' },
  warnText: { fontSize: 12, textAlign: 'center', paddingBottom: 8 },
  diaGrupo: { marginBottom: 4 },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  diaHeaderTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  diaCountPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diaCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  diaEjCount: {
    fontSize: 10,
    fontWeight: '600',
  },
});
