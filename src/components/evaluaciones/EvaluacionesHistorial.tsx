import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import {
  EvaluacionGrupo,
  EvaluacionRegistroResumen,
} from '../../types/evaluaciones.types';
import { Socio } from '../../types/socios.types';
import {
  buildHistorialSesiones,
  clearEvaluacionSessionForGrupo,
  groupHistorialByGrupo,
  groupRegistrosByPrueba,
  readSessionState,
  sessionStorageKey,
  summarizeSessionState,
  todayYmdLocal,
  type HistorialGrupoEvaluacion,
} from '../../utils/evaluaciones/registrosTimeline';
import { listPruebasEvolucionEnGrupo } from '../../utils/evaluaciones/evolucionPrueba';
import { flattenPruebasFromGrupo } from '../../utils/evaluaciones/pruebaOrdering';
import {
  formatRangoFechas,
  formatSesionFechaHora,
} from '../../utils/evaluaciones/evalDateTime';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import { palette } from '../../constants/colors';
import { hapticSelection } from '../../utils/haptics';
import SocioSelector from '../common/SocioSelector';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import Button from '../common/Button';
import GroupedSection from '../common/GroupedSection';
import ListRow from '../common/ListRow';
import EvaluacionRegistroDetalleModal from './EvaluacionRegistroDetalleModal';
import EvaluacionGrupoEvolucionModal from './EvaluacionGrupoEvolucionModal';
import type { NuevaEvaluacionPrefill } from './NuevaEvaluacionFlow';

interface Props {
  esSocio: boolean;
  socioId: string | undefined;
  selectedSocio: Socio | null;
  onSelectSocio: (s: Socio) => void;
  onRefreshRequest?: number;
  onNuevaMedicion?: (prefill: NuevaEvaluacionPrefill) => void;
}

function StatPill({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={styles.statPill}>
      <View style={[styles.statIcon, { backgroundColor: `${colors.tint}14` }]}>
        <Ionicons name={icon} size={16} color={colors.tint} />
      </View>
      <Text style={[styles.statValue, { color: colors.label }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.secondaryLabel }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function EvaluacionesHistorial({
  esSocio,
  socioId,
  selectedSocio,
  onSelectSocio,
  onRefreshRequest,
  onNuevaMedicion,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const [catalogo, setCatalogo] = useState<EvaluacionGrupo[]>([]);
  const [registros, setRegistros] = useState<EvaluacionRegistroResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set());
  const [expandedSesiones, setExpandedSesiones] = useState<Set<string>>(new Set());
  const [grupoEvolucionModal, setGrupoEvolucionModal] = useState<HistorialGrupoEvaluacion | null>(
    null
  );

  const byPrueba = useMemo(() => groupRegistrosByPrueba(registros), [registros]);
  const sesiones = useMemo(
    () => buildHistorialSesiones(registros, catalogo),
    [registros, catalogo]
  );
  const grupos = useMemo(() => groupHistorialByGrupo(sesiones), [sesiones]);

  const stats = useMemo(() => {
    const ultimaSesion = [...sesiones].sort((a, b) => b.sessionIndex - a.sessionIndex)[0];
    return {
      evaluaciones: sesiones.length,
      pruebas: byPrueba.size,
      registros: registros.length,
      ultimaSesion,
    };
  }, [byPrueba, sesiones, registros.length]);

  const ultimaLabel = stats.ultimaSesion
    ? formatSesionFechaHora(stats.ultimaSesion.fecha, stats.ultimaSesion.registradoAt)
    : '—';

  const loadRegistros = useCallback(async () => {
    if (!socioId) return;
    setLoading(true);
    try {
      const data = await evaluacionesService.listAllRegistros({ id_usuario_socio: socioId });
      setRegistros(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [socioId]);

  useEffect(() => {
    void evaluacionesService.getCatalogo().then(setCatalogo).catch(() => undefined);
  }, []);

  useEffect(() => {
    setExpandedGrupos(new Set());
    setExpandedSesiones(new Set());
    setDetalleId(null);
    if (socioId) {
      void loadRegistros();
    } else {
      setRegistros([]);
    }
  }, [socioId, loadRegistros, onRefreshRequest]);

  useEffect(() => {
    if (grupos.length === 0) {
      setExpandedGrupos(new Set());
      setExpandedSesiones(new Set());
      return;
    }
    setExpandedGrupos((prev) => {
      const valid = [...prev].filter((id) => grupos.some((g) => g.grupoId === id));
      if (valid.length > 0) return new Set(valid);
      return new Set([grupos[0].grupoId]);
    });
    setExpandedSesiones((prev) => {
      const valid = [...prev].filter((key) =>
        grupos.some((g) => g.sesiones.some((s) => s.key === key))
      );
      if (valid.length > 0) return new Set(valid);
      const latest = grupos[0]?.sesiones[0];
      return latest ? new Set([latest.key]) : new Set();
    });
  }, [grupos]);

  const toggleGrupo = (grupoId: string) => {
    hapticSelection();
    setExpandedGrupos((prev) => {
      const next = new Set(prev);
      if (next.has(grupoId)) next.delete(grupoId);
      else next.add(grupoId);
      return next;
    });
  };

  const toggleSesion = (key: string) => {
    hapticSelection();
    setExpandedSesiones((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const iniciarNuevaEvaluacion = (grupo: NonNullable<(typeof grupos)[0]['grupo']>) => {
    if (!onNuevaMedicion || !socioId) return;
    const pruebaIds = flattenPruebasFromGrupo(grupo).map((p) => p.id);
    const fecha = todayYmdLocal();
    const progress = summarizeSessionState(
      readSessionState(sessionStorageKey(socioId, fecha, grupo.id)),
      pruebaIds
    );

    if (progress.hasProgress) {
      Alert.alert(
        'Sesión en curso',
        `Hay progreso guardado hoy (${progress.guardadas + progress.omitidas}/${progress.total} pruebas). ¿Querés continuar o empezar de cero?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Empezar de cero',
            style: 'destructive',
            onPress: () => {
              clearEvaluacionSessionForGrupo(socioId, fecha, grupo.id, pruebaIds);
              onNuevaMedicion({ socioId, grupoId: grupo.id, fecha, freshStart: true });
            },
          },
          {
            text: 'Continuar',
            onPress: () => onNuevaMedicion({ socioId, grupoId: grupo.id, fecha }),
          },
        ]
      );
      return;
    }

    onNuevaMedicion({ socioId, grupoId: grupo.id, fecha, freshStart: true });
  };

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.28 : 0.07,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
  });

  return (
    <View>
      {!esSocio ? (
        <GroupedSection title="Socio" style={styles.selectorSection}>
          <SocioSelector selected={selectedSocio} onSelect={onSelectSocio} />
        </GroupedSection>
      ) : null}

      {!socioId ? (
        <EmptyState
          icon="account-search"
          title="Seleccioná un socio"
          message="Elegí un socio para ver su historial de evaluaciones por sesiones"
        />
      ) : loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : sesiones.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="Sin evaluaciones"
          message={
            selectedSocio
              ? `${selectedSocio.nombre} todavía no tiene evaluaciones registradas`
              : 'Este socio todavía no tiene evaluaciones registradas'
          }
        />
      ) : (
        <View style={styles.content}>
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: colors.secondaryGroupedBackground,
                borderColor: colors.separator,
              },
              cardShadow,
            ]}
          >
            <StatPill
              icon="calendar-outline"
              label="Sesiones"
              value={stats.evaluaciones}
              colors={colors}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <StatPill
              icon="list-outline"
              label="Pruebas"
              value={stats.pruebas}
              colors={colors}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <StatPill
              icon="document-text-outline"
              label="Registros"
              value={stats.registros}
              colors={colors}
            />
          </View>

          <Text style={[styles.summaryText, typography.footnote, { color: colors.secondaryLabel }]}>
            {grupos.length} tipo{grupos.length !== 1 ? 's' : ''} · {sesiones.length} sesión
            {sesiones.length !== 1 ? 'es' : ''} · Última: {ultimaLabel}
          </Text>

          {grupos.map((grupo) => {
            const isOpen = expandedGrupos.has(grupo.grupoId);
            const pruebasEvolucion = listPruebasEvolucionEnGrupo(grupo);

            return (
              <View
                key={grupo.grupoId}
                style={[
                  styles.grupoCard,
                  {
                    backgroundColor: colors.secondaryGroupedBackground,
                    borderColor: colors.separator,
                  },
                  cardShadow,
                ]}
              >
                <Pressable
                  onPress={() => toggleGrupo(grupo.grupoId)}
                  style={({ pressed }) => [
                    pressed && { opacity: 0.94, transform: [{ scale: 0.996 }] },
                  ]}
                >
                  <View style={[styles.grupoHeaderBand, { backgroundColor: colors.tint }]}>
                    <View style={styles.grupoHeaderTop}>
                      <View style={styles.grupoHeaderIcon}>
                        <MaterialCommunityIcons
                          name="clipboard-pulse-outline"
                          size={20}
                          color={colors.tint}
                        />
                      </View>

                      <View style={styles.grupoHeaderText}>
                        <Text style={styles.grupoEyebrow}>Tipo de evaluación</Text>
                        <Text style={styles.grupoTitleBand} numberOfLines={2}>
                          {grupo.grupoNombre}
                        </Text>
                        <Text style={styles.grupoMetaBand}>
                          {formatRangoFechas(grupo.primeraFecha, grupo.ultimaFecha)}
                        </Text>
                      </View>

                      <View style={styles.grupoHeaderBadges}>
                        <View style={styles.sesionesBadge}>
                          <Text style={styles.sesionesBadgeNum}>{grupo.sesiones.length}</Text>
                          <Text style={styles.sesionesBadgeLabel}>
                            sesión{grupo.sesiones.length !== 1 ? 'es' : ''}
                          </Text>
                        </View>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="rgba(255,255,255,0.85)"
                        />
                      </View>
                    </View>
                  </View>

                  {!isOpen ? (
                    <View style={[styles.grupoCollapsedFooter, { borderTopColor: colors.separator }]}>
                      <Text style={[styles.grupoCollapsedHint, { color: colors.secondaryLabel }]}>
                        Ver sesiones y pruebas
                      </Text>
                      <Ionicons name="layers-outline" size={16} color={colors.tertiaryLabel} />
                    </View>
                  ) : null}
                </Pressable>

                {isOpen ? (
                  <View style={styles.grupoBody}>
                    {pruebasEvolucion.length > 0 ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.evolucionRow,
                          {
                            backgroundColor: colors.tertiaryGroupedBackground,
                            borderColor: colors.separator,
                          },
                          pressed && { opacity: 0.9 },
                        ]}
                        onPress={() => {
                          hapticSelection();
                          setGrupoEvolucionModal(grupo);
                        }}
                      >
                        <View style={[styles.evolucionIcon, { backgroundColor: `${palette.info}18` }]}>
                          <Ionicons name="analytics-outline" size={18} color={palette.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.evolucionTitle, { color: colors.label }]}>
                            Comparar evolución
                          </Text>
                          <Text style={[styles.evolucionHint, { color: colors.secondaryLabel }]}>
                            {pruebasEvolucion.length} prueba
                            {pruebasEvolucion.length !== 1 ? 's' : ''} · 1° a actual
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
                      </Pressable>
                    ) : null}

                    <Text
                      style={[
                        styles.sesionesSectionTitle,
                        typography.sectionHeader,
                        { color: colors.secondaryLabel },
                      ]}
                    >
                      Sesiones
                    </Text>

                    <View
                      style={[
                        styles.sesionesBlock,
                        {
                          backgroundColor: colors.tertiaryGroupedBackground,
                          borderColor: colors.separator,
                        },
                      ]}
                    >
                      {grupo.sesiones.map((sesion, idx) => {
                        const sesionOpen = expandedSesiones.has(sesion.key);
                        const isLatest = sesion.numeroSesion === sesion.totalSesionesGrupo;
                        const pct = sesion.totalPruebasGrupo
                          ? Math.round((sesion.pruebas.length / sesion.totalPruebasGrupo) * 100)
                          : 100;

                        return (
                          <View key={sesion.key}>
                            <Pressable
                              onPress={() => toggleSesion(sesion.key)}
                              style={({ pressed }) => [
                                styles.sesionRow,
                                idx > 0 && {
                                  borderTopWidth: StyleSheet.hairlineWidth,
                                  borderTopColor: colors.separator,
                                },
                                pressed && { opacity: 0.85 },
                              ]}
                            >
                              <View
                                style={[
                                  styles.sesionNum,
                                  {
                                    backgroundColor: isLatest
                                      ? `${palette.success}18`
                                      : colors.secondaryGroupedBackground,
                                    borderColor: isLatest ? `${palette.success}55` : colors.separator,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.sesionNumText,
                                    { color: isLatest ? palette.success : colors.label },
                                  ]}
                                >
                                  {sesion.numeroSesion}°
                                </Text>
                              </View>

                              <View style={styles.sesionContent}>
                                <View style={styles.sesionTitleRow}>
                                  <Text
                                    style={[styles.sesionFecha, typography.subhead, { color: colors.label }]}
                                    numberOfLines={2}
                                  >
                                    {formatSesionFechaHora(sesion.fecha, sesion.registradoAt)}
                                  </Text>
                                  {isLatest ? <Badge label="Reciente" variant="success" /> : null}
                                </View>
                                <Text style={[styles.sesionMeta, { color: colors.secondaryLabel }]}>
                                  {sesion.pruebas.length}/{sesion.totalPruebasGrupo} pruebas · {pct}%
                                </Text>
                                <View
                                  style={[
                                    styles.progressTrack,
                                    { backgroundColor: colors.secondaryGroupedBackground },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.progressFill,
                                      {
                                        width: `${pct}%`,
                                        backgroundColor: isLatest ? palette.success : colors.tint,
                                      },
                                    ]}
                                  />
                                </View>
                              </View>

                              <Ionicons
                                name={sesionOpen ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={colors.tertiaryLabel}
                              />
                            </Pressable>

                            {sesionOpen ? (
                              <View
                                style={[
                                  styles.pruebasList,
                                  {
                                    backgroundColor: colors.secondaryGroupedBackground,
                                    borderTopColor: colors.separator,
                                  },
                                ]}
                              >
                                {sesion.pruebas.map((p, pIdx) => (
                                  <ListRow
                                    key={p.registro.id}
                                    title={p.nombre}
                                    subtitle={
                                      p.seccionNombre ||
                                      p.registro.observaciones ||
                                      undefined
                                    }
                                    icon="checkmark-circle"
                                    onPress={() => setDetalleId(p.registro.id)}
                                    isLast={pIdx === sesion.pruebas.length - 1}
                                    detail="Ver"
                                  />
                                ))}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>

                    {onNuevaMedicion && grupo.grupo ? (
                      <View style={styles.nuevaBox}>
                        <Button
                          title="Nueva evaluación de este tipo"
                          onPress={() => iniciarNuevaEvaluacion(grupo.grupo!)}
                          icon="plus-circle-outline"
                          variant="outline"
                        />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <EvaluacionRegistroDetalleModal
        registroId={detalleId}
        onClose={() => setDetalleId(null)}
      />

      <EvaluacionGrupoEvolucionModal
        visible={grupoEvolucionModal != null}
        grupo={grupoEvolucionModal}
        onClose={() => setGrupoEvolucionModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectorSection: { marginBottom: 4 },
  loaderContainer: { paddingVertical: 60, alignItems: 'center' },
  content: { gap: 14 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  summaryText: {
    marginHorizontal: 4,
    lineHeight: 18,
  },
  grupoCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  grupoHeaderBand: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  grupoHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  grupoHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grupoHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  grupoEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grupoTitleBand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 4,
  },
  grupoMetaBand: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  grupoHeaderBadges: {
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 2,
  },
  sesionesBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
  },
  sesionesBadgeNum: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 19,
  },
  sesionesBadgeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  grupoCollapsedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grupoCollapsedHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  grupoBody: {
    padding: 14,
    gap: 12,
  },
  evolucionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  evolucionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolucionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  evolucionHint: {
    fontSize: 12,
    marginTop: 2,
  },
  sesionesSectionTitle: {
    marginLeft: 2,
    marginBottom: -4,
  },
  sesionesBlock: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sesionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sesionNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sesionNumText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sesionContent: {
    flex: 1,
    minWidth: 0,
  },
  sesionTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  sesionFecha: {
    flexShrink: 1,
    fontWeight: '600',
  },
  sesionMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pruebasList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nuevaBox: {
    paddingTop: 2,
  },
});
