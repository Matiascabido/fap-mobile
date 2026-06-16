import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { metricasService } from '../../services/api/metricas.service';
import { DashboardVista, MetricasDashboardResponse } from '../../types/metricas.types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { palette } from '../../constants/colors';
import { formatCurrency, getGreeting } from '../../utils/formatters';
import KpiCard from '../../components/common/KpiCard';
import EvolutionChart from '../../components/common/EvolutionChart';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function MetricasScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<MetricasDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  const loadDashboard = useCallback(async () => {
    setError(false);
    try {
      const data = await metricasService.getDashboard();
      setDashboard(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (error || !dashboard) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <EmptyState
          icon="chart-line"
          title="No se pudieron cargar las métricas"
          message="Deslizá para reintentar"
        />
      </View>
    );
  }

  const metricas = dashboard.metricas;
  const schema = metricas.schema_panel;
  const panelTitle = metricasPanelTitle(dashboard.vista);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
    >
      <LinearGradient
        colors={['#0f172a', '#7f1d1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroEyebrow}>MÉTRICAS DEL SISTEMA · GUIA FA</Text>
        <Text style={styles.heroTitle}>
          {getGreeting()}, <Text style={styles.heroName}>{user?.nombre ?? 'usuario'}</Text>!
        </Text>
        <Text style={styles.heroSubtitle}>{panelTitle}</Text>
        <Text style={styles.heroMeta}>
          Actualizado: {new Date(dashboard.generado_en).toLocaleString('es-AR')}
        </Text>
      </LinearGradient>

      {schema === 'god_v1' && <GodPanel metricas={metricas} textPrimary={textPrimary} textSecondary={textSecondary} />}
      {schema === 'profesional_v1' && (
        <ProfesionalPanel metricas={metricas} textPrimary={textPrimary} textSecondary={textSecondary} />
      )}
      {schema === 'socio_v1' && (
        <SocioPanel metricas={metricas} textPrimary={textPrimary} textSecondary={textSecondary} />
      )}
      {!schema && (
        <EmptyState icon="information-outline" title="Panel no disponible para tu rol" />
      )}

      {/* Recomendaciones (compartido) */}
      {metricas.recomendaciones && metricas.recomendaciones.length > 0 && (
        <Card style={styles.recoCard}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recomendaciones</Text>
          {metricas.recomendaciones.map((reco, i) => (
            <View key={i} style={styles.recoRow}>
              <MaterialCommunityIcons name="lightbulb-on" size={16} color={palette.warning} />
              <Text style={[styles.recoText, { color: textSecondary }]}>{reco}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function metricasPanelTitle(vista: DashboardVista): string {
  switch (vista) {
    case 'admin_global':
      return 'Vista general del club';
    case 'profesional':
      return 'Tu actividad como profesional';
    case 'admin_socio':
      return 'Gestión de socios';
    case 'socio':
      return 'Tu progreso y actividad';
    default:
      return 'Panel de métricas';
  }
}

interface PanelProps {
  metricas: MetricasDashboardResponse['metricas'];
  textPrimary: string;
  textSecondary: string;
}

function GodPanel({ metricas, textPrimary }: PanelProps) {
  const u = metricas.usuarios;
  const s = metricas.suscripciones;
  const p = metricas.planes;
  const t = metricas.turnos;
  const fin = metricas.financieras_avanzadas;

  const mrrEvolucion = fin?.evolucion_mrr_ultimos_6_meses || [];
  const chartLabels = mrrEvolucion.map((m) => m.mes?.slice(5) || '');
  const chartData = mrrEvolucion.map((m) => {
    const val = (m as any).mrr ?? (m as any).valor ?? (m as any).total ?? 0;
    return typeof val === 'number' ? val : 0;
  });

  return (
    <>
      <SectionLabel title="Resumen general" color={textPrimary} />
      <View style={styles.grid}>
        <KpiCard label="Usuarios totales" value={u?.total ?? 0} icon="account-group" />
        <KpiCard label="Nuevos (30d)" value={u?.nuevos_ultimos_30_dias ?? 0} icon="account-plus" accent={palette.success} />
        <KpiCard
          label="Suscripciones vigentes"
          value={s?.vigentes_hoy ?? 0}
          icon="card-account-details"
          accent={palette.info}
        />
        <KpiCard
          label="MRR catálogo"
          value={formatCurrency(s?.importe_mensual_catalogo_suma_vigentes ?? s?.importe_mensual_catalogo_vigentes ?? 0)}
          icon="cash-multiple"
          accent={palette.success}
        />
        <KpiCard label="Planes activos" value={p?.asignaciones_activas ?? 0} icon="dumbbell" accent={palette.warning} />
        <KpiCard label="Turnos hoy" value={t?.hoy ?? 0} icon="calendar-today" accent={palette.info} />
      </View>

      {chartData.length > 0 && chartData.some((d) => d > 0) && (
        <EvolutionChart labels={chartLabels} data={chartData} title="Evolución MRR (6 meses)" />
      )}

      {metricas.ranking_profesionales_completo && metricas.ranking_profesionales_completo.length > 0 && (
        <Card style={styles.rankingCard}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Top profesionales</Text>
          {metricas.ranking_profesionales_completo.slice(0, 5).map((prof, i) => (
            <View key={i} style={styles.rankingRow}>
              <Text style={[styles.rankingPos, { color: palette.primary }]}>#{prof.ranking_posicion ?? i + 1}</Text>
              <Text style={[styles.rankingName, { color: textPrimary }]} numberOfLines={1}>
                {[prof.nombre, prof.apellido].filter(Boolean).join(' ') || 'Profesional'}
              </Text>
              <Text style={[styles.rankingValue, { color: palette.success }]}>
                {formatCurrency(prof.importe_mensual_catalogo_vigentes ?? 0)}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function ProfesionalPanel({ metricas, textPrimary }: PanelProps) {
  const act = metricas.actividad_como_profesional_o_docente;
  const alumnos = metricas.alumnos_y_socios;
  const eco = metricas.economia_y_proyeccion_catalogo;

  return (
    <>
      <SectionLabel title="Mi actividad" color={textPrimary} />
      <View style={styles.grid}>
        <KpiCard
          label="Alumnos vinculados"
          value={alumnos?.total_distintos_vinculados_por_plan_o_suscripcion ?? 0}
          icon="account-group"
        />
        <KpiCard
          label="Con abono vigente"
          value={act?.socios_distintos_con_abono_vigente_hacia_el ?? alumnos?.con_suscripcion_vigente_conmigo ?? 0}
          icon="account-check"
          accent={palette.success}
        />
        <KpiCard
          label="Planes asignados"
          value={act?.asignaciones_planes_como_profesional_activas ?? 0}
          icon="dumbbell"
          accent={palette.warning}
        />
        <KpiCard
          label="Suscripciones vigentes"
          value={act?.suscripciones_como_profesional_vigentes ?? 0}
          icon="card-account-details"
          accent={palette.info}
        />
        <KpiCard
          label="Turnos (próx. 7d)"
          value={act?.turnos_creados_proximos_7_dias ?? 0}
          icon="calendar-clock"
          accent={palette.info}
        />
        <KpiCard
          label="Ingreso mensual"
          value={formatCurrency(eco?.importe_mensual_catalogo_suscripciones_activas_hoy ?? 0)}
          icon="cash"
          accent={palette.success}
        />
      </View>
    </>
  );
}

function SocioPanel({ metricas, textPrimary, textSecondary }: PanelProps) {
  const eco = metricas.economia_suscripciones;
  const asistencia = metricas.asistencia_y_actividad_en_clases;
  const constancia = metricas.constancia_avanzada;
  const fin = metricas.financiero_personal;
  const proximoVenc = eco?.proximo_vencimiento ?? metricas.proximo_vencimiento;

  const historial = fin?.historial_mensual_ultimos_6_meses || [];
  const chartLabels = historial.map((m) => m.mes?.slice(5) || '');
  const chartData = historial.map((m) => {
    const val = (m as any).pagado ?? (m as any).monto ?? (m as any).total ?? (m as any).valor ?? 0;
    return typeof val === 'number' ? val : 0;
  });

  return (
    <>
      <SectionLabel title="Mi resumen" color={textPrimary} />
      <View style={styles.grid}>
        <KpiCard
          label="Clases asistidas"
          value={asistencia?.dias_calendario_distintos_con_clase_ya_realizada ?? 0}
          icon="calendar-check"
          accent={palette.success}
        />
        <KpiCard
          label="Inscripciones futuras"
          value={asistencia?.inscripciones_en_clases_futuras ?? 0}
          icon="calendar-clock"
          accent={palette.info}
        />
        <KpiCard
          label="Frecuencia semanal"
          value={(constancia?.frecuencia_semanal_promedio_30d ?? 0).toFixed(1)}
          icon="repeat"
          accent={palette.warning}
          subtitle="prom. 30 días"
        />
        <KpiCard
          label="Racha semanas"
          value={constancia?.racha_semanas_consecutivas ?? 0}
          icon="fire"
          accent={palette.error}
        />
        <KpiCard
          label="Suscripciones"
          value={eco?.cantidad_suscripciones_vigentes ?? 0}
          icon="card-account-details"
          accent={palette.info}
        />
        <KpiCard
          label="A abonar mensual"
          value={formatCurrency(eco?.importe_mensual_catalogo_total_abonar_vigentes ?? 0)}
          icon="cash"
          accent={palette.success}
        />
      </View>

      {/* Próximo vencimiento */}
      {proximoVenc && (
        <Card style={styles.vencCard}>
          <View style={styles.vencHeader}>
            <MaterialCommunityIcons name="clock-alert" size={20} color={palette.warning} />
            <Text style={[styles.vencTitle, { color: textPrimary }]}>Próximo vencimiento</Text>
          </View>
          <Text style={[styles.vencDetalle, { color: textSecondary }]}>
            {proximoVenc.detalle_nombre || 'Suscripción'}
            {proximoVenc.profesional ? ` · ${proximoVenc.profesional}` : ''}
          </Text>
          <Text style={[styles.vencDias, { color: palette.warning }]}>
            {proximoVenc.dias_hasta_vencimiento != null
              ? `${proximoVenc.dias_hasta_vencimiento} días restantes`
              : proximoVenc.fecha_vencimiento || ''}
          </Text>
        </Card>
      )}

      {chartData.length > 0 && chartData.some((d) => d > 0) && (
        <EvolutionChart labels={chartLabels} data={chartData} title="Pagos (últimos 6 meses)" />
      )}
    </>
  );
}

function SectionLabel({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: 'rgba(147,197,253,0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  heroName: {
    color: '#f87171',
  },
  heroSubtitle: {
    color: palette.slate400,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  rankingCard: {
    marginTop: 8,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  rankingPos: {
    fontSize: 15,
    fontWeight: '800',
    width: 36,
  },
  rankingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  rankingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  vencCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  vencHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vencTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  vencDetalle: {
    fontSize: 14,
    marginTop: 8,
  },
  vencDias: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  recoCard: {
    marginTop: 8,
  },
  recoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  recoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
