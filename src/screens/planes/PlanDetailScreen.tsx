import React, { useState, useEffect, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { PlanWithRelations, Bloque, PlanBloqueRelacion, PlanEjercicioItem } from '../../types/planes.types';
import { PlanesStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanDetailRouteProp = RouteProp<PlanesStackParamList, 'PlanDetail'>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function PlanDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlanDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const { planId } = route.params;

  const [planData, setPlanData] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBloques, setExpandedBloques] = useState<Set<string>>(new Set());

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const loadPlan = useCallback(async () => {
    try {
      // El backend devuelve la lista completa; buscamos el plan por ID
      const all = await planesService.getAll();
      const found = all.find((p) => p.plan.id === planId);
      setPlanData(found || null);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const toggleBloque = (bloqueId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBloques((prev) => {
      const next = new Set(prev);
      if (next.has(bloqueId)) {
        next.delete(bloqueId);
      } else {
        next.add(bloqueId);
      }
      return next;
    });
  };

  if (loading) {
    return <Loader fullscreen message="Cargando plan..." />;
  }

  if (!planData) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
          </TouchableOpacity>
        </View>
        <EmptyState icon="alert-circle-outline" title="Plan no encontrado" />
      </View>
    );
  }

  const plan = planData.plan;
  const asignacion = planData.asignaciones?.[0];
  const isActive = planData.activo ?? planData.asignaciones?.some((a) => a.activo) ?? false;

  // Normalizar bloques a una estructura uniforme
  const bloques = normalizeBloques(planData);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: textPrimary }]} numberOfLines={1}>
          {plan.nombre_plan}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info del plan */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={[styles.planName, { color: textPrimary }]}>{plan.nombre_plan}</Text>
            <Badge
              label={isActive ? 'Activo' : 'Finalizado'}
              variant={isActive ? 'success' : 'neutral'}
            />
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
              <Text style={[styles.objetivoLabel, { color: textSecondary }]}>
                Objetivo semanal
              </Text>
              <Text style={[styles.objetivoText, { color: textPrimary }]}>
                {plan.objetivo_semanal}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Bloques de entrenamiento */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          Bloques de entrenamiento
        </Text>

        {bloques.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              Este plan todavía no tiene bloques cargados.
            </Text>
          </Card>
        ) : (
          bloques.map((bloque, index) => {
            const bloqueId = bloque.id || `bloque-${index}`;
            const isExpanded = expandedBloques.has(bloqueId);
            const ejercicios = bloque.ejercicios || [];
            const diaNombre =
              bloque.dia_semana != null && bloque.dia_semana >= 0 && bloque.dia_semana <= 6
                ? DIAS_SEMANA[bloque.dia_semana]
                : null;

            return (
              <Card key={bloqueId} style={styles.bloqueCard} padding={0}>
                <TouchableOpacity
                  style={styles.bloqueHeader}
                  onPress={() => toggleBloque(bloqueId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.bloqueColorDot,
                      { backgroundColor: bloque.color || palette.primary },
                    ]}
                  />
                  <View style={styles.bloqueHeaderInfo}>
                    <Text style={[styles.bloqueNombre, { color: textPrimary }]}>
                      {bloque.nombre}
                    </Text>
                    <Text style={[styles.bloqueMeta, { color: textSecondary }]}>
                      {diaNombre ? `${diaNombre} · ` : ''}
                      {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.ejerciciosContainer, { borderTopColor: borderColor }]}>
                    {ejercicios.length === 0 ? (
                      <Text style={[styles.emptyText, { color: textSecondary }]}>
                        Sin ejercicios en este bloque
                      </Text>
                    ) : (
                      ejercicios.map((ej, ejIndex) => (
                        <EjercicioRow
                          key={ej.id || `ej-${ejIndex}`}
                          ejercicio={ej}
                          textPrimary={textPrimary}
                          textSecondary={textSecondary}
                          borderColor={borderColor}
                          isLast={ejIndex === ejercicios.length - 1}
                        />
                      ))
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
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

interface EjercicioRowProps {
  ejercicio: PlanEjercicioItem;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  isLast: boolean;
}

function EjercicioRow({ ejercicio, textPrimary, textSecondary, borderColor, isLast }: EjercicioRowProps) {
  const nombre =
    (ejercicio.ejercicio?.nombre as string) ||
    (ejercicio.ejercicio?.nombre_ejercicio as string) ||
    'Ejercicio';

  return (
    <View style={[styles.ejercicioRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }]}>
      <View style={styles.ejercicioMain}>
        <MaterialCommunityIcons name="arm-flex" size={16} color={palette.primary} />
        <Text style={[styles.ejercicioNombre, { color: textPrimary }]} numberOfLines={1}>
          {nombre}
        </Text>
      </View>
      <View style={styles.ejercicioStats}>
        {ejercicio.series ? (
          <Stat label="Series" value={ejercicio.series} color={textSecondary} />
        ) : null}
        {ejercicio.reps ? (
          <Stat label="Reps" value={ejercicio.reps} color={textSecondary} />
        ) : null}
        {ejercicio.peso ? (
          <Stat label="Peso" value={ejercicio.peso} color={textSecondary} />
        ) : null}
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color: palette.primary }]}>{value}</Text>
    </View>
  );
}

/**
 * Normaliza los bloques a una estructura uniforme (Bloque[])
 */
function normalizeBloques(planData: PlanWithRelations): Bloque[] {
  const result: Bloque[] = [];

  // Si hay bloques_por_dia, usamos esa estructura
  if (planData.bloques_por_dia && planData.bloques_por_dia.length > 0) {
    for (const grupo of planData.bloques_por_dia) {
      for (const rel of grupo.bloques) {
        result.push(relacionToBloque(rel, grupo.dia_semana));
      }
    }
    return result;
  }

  // Si no, usamos bloques (pueden ser Bloque o PlanBloqueRelacion)
  for (const b of planData.bloques || []) {
    if ('bloque' in b) {
      result.push(relacionToBloque(b as PlanBloqueRelacion));
    } else {
      result.push(b as Bloque);
    }
  }

  return result;
}

function relacionToBloque(rel: PlanBloqueRelacion, diaSemana?: number | null): Bloque {
  return {
    ...rel.bloque,
    ejercicios: rel.ejercicios || rel.bloque.ejercicios,
    dia_semana: rel.dia_semana ?? diaSemana ?? rel.bloque.dia_semana,
    orden_en_plan: rel.orden ?? rel.bloque.orden_en_plan,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  planDesc: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  infoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  objetivoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  objetivoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  objetivoText: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bloqueCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  bloqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bloqueColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  bloqueHeaderInfo: {
    flex: 1,
  },
  bloqueNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  bloqueMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  ejerciciosContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  ejercicioRow: {
    paddingVertical: 12,
  },
  ejercicioMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ejercicioNombre: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  ejercicioStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
    marginLeft: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
