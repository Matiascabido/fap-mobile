import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { turneroService } from '../../services/api/turnero.service';
import { TurnoResponse } from '../../types/turnero.types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { formatTime, capitalize } from '../../utils/formatters';
import { turnoSinCupo, porcentajeOcupacion } from '../../utils/turneroCupo';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export default function TurneroScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canEnrollTurnos, canManageTurnos, isProfesionalUser } = usePermissions();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inscribiendo, setInscribiendo] = useState<string | null>(null);
  const daysScrollRef = useRef<ScrollView>(null);

  const bgColor = isDark ? palette.darkBg : palette.slate50;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek]
  );
  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const userEmail = user?.mail;

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const loadTurnos = useCallback(async () => {
    try {
      const params: Record<string, string> = {
        desde: weekStart.toISOString(),
        hasta: weekEnd.toISOString(),
      };

      // Filtrado por rol según spec:
      // - Socio/entrenado: ver solo sus inscripciones (email_socio)
      // - Profesional: ver solo sus turnos creados (email_profesional)
      // - Admin/GOD: ver todos
      if (canEnrollTurnos() && userEmail) {
        params.email_socio = userEmail;
      } else if (isProfesionalUser && !canManageTurnos() && userEmail) {
        // Profesional sin admin: ve sus turnos propios
        params.email_profesional = userEmail;
      }

      const data = await turneroService.list(params);
      setTurnos(data);
    } catch (error) {
      console.error('Error loading turnos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart, weekEnd, canEnrollTurnos, canManageTurnos, isProfesionalUser, userEmail]);

  useEffect(() => {
    setLoading(true);
    loadTurnos();
  }, [weekKey, loadTurnos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTurnos();
  }, [loadTurnos]);

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDay(today);
  };

  const turnosDelDia = useMemo(() => {
    return turnos
      .filter((t) => {
        try {
          return isSameDay(parseISO(t.fecha_inicio), selectedDay);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  }, [turnos, selectedDay]);

  const turnosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of turnos) {
      try {
        const key = format(parseISO(t.fecha_inicio), 'yyyy-MM-dd');
        map.set(key, (map.get(key) || 0) + 1);
      } catch {
        // ignorar fechas inválidas
      }
    }
    return map;
  }, [turnos]);

  const isInscripto = (turno: TurnoResponse): boolean => {
    if (turno.inscripto != null) return turno.inscripto;
    if (turno.esta_inscripto != null) return turno.esta_inscripto;
    if (turno.yo_inscripto != null) return turno.yo_inscripto;
    if (turno.usuario_inscripto != null) return turno.usuario_inscripto;
    if (turno.inscriptos && user) {
      return turno.inscriptos.some(
        (i: any) => i.email === user.mail || i.mail === user.mail
      );
    }
    return false;
  };

  const handleInscripcion = async (turno: TurnoResponse) => {
    const inscripto = isInscripto(turno);
    setInscribiendo(turno.id_turno);
    try {
      if (inscripto) {
        await turneroService.desinscribir(turno.id_turno);
      } else {
        await turneroService.inscribir(turno.id_turno);
      }
      await loadTurnos();
    } catch {
      // Error mostrado en interceptor
    } finally {
      setInscribiendo(null);
    }
  };

  // Indicadores contextuales
  const showRoleBadge = canManageTurnos();
  const roleLabel = isProfesionalUser && !showRoleBadge ? 'Profesional' : showRoleBadge ? 'Staff' : null;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor }]}>
        <LinearGradient
          colors={['rgba(220,38,38,0.08)', 'transparent']}
          style={styles.cardGradient}
        />

        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Agenda semanal</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              {capitalize(format(weekStart, 'd MMM', { locale: es }))} –{' '}
              {capitalize(format(weekEnd, 'd MMM yyyy', { locale: es }))}
            </Text>
          </View>
          {roleLabel && (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Hoy</Text>
          </TouchableOpacity>
          <View style={styles.weekNav}>
            <TouchableOpacity
              onPress={() => setCurrentWeek((w) => subWeeks(w, 1))}
              style={styles.weekNavButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentWeek((w) => addWeeks(w, 1))}
              style={styles.weekNavButton}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={daysScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            const dayKey = format(day, 'yyyy-MM-dd');
            const count = turnosPorDia.get(dayKey) || 0;

            return (
              <TouchableOpacity
                key={dayKey}
                style={[
                  styles.dayChip,
                  { borderColor: isToday && !isSelected ? palette.primary : borderColor },
                  isSelected && styles.dayChipSelected,
                  isToday && !isSelected && styles.dayChipToday,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[styles.dayName, { color: isSelected ? '#FFFFFF' : textSecondary }]}
                >
                  {capitalize(format(day, 'EEE', { locale: es })).slice(0, 3)}
                </Text>
                <Text
                  style={[styles.dayNumber, { color: isSelected ? '#FFFFFF' : textPrimary }]}
                >
                  {format(day, 'd')}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.dayBadge,
                      { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#d1fae5' },
                    ]}
                  >
                    <Text
                      style={[styles.dayBadgeText, { color: isSelected ? '#FFFFFF' : '#047857' }]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.dayHeader, { borderTopColor: borderColor }]}>
          <Text style={[styles.selectedDayTitle, { color: textPrimary }]}>
            {capitalize(format(selectedDay, "EEEE d 'de' MMMM", { locale: es }))}
          </Text>
          <Text style={[styles.turnosCount, { color: textSecondary }]}>
            {turnosDelDia.length} {turnosDelDia.length === 1 ? 'turno' : 'turnos'}
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.turnosContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[palette.primary]}
                tintColor={palette.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {turnosDelDia.length === 0 ? (
              <EmptyState
                icon="calendar-blank"
                title="Sin turnos"
                message="No hay clases programadas para este día"
              />
            ) : (
              turnosDelDia.map((turno) => {
                const inscripto = isInscripto(turno);
                const inscriptos = turno.cantidad_inscriptos ?? 0;
                const cupos = turno.cupos_maximos ?? 0;
                const sinCupos = turnoSinCupo({ cupos_libres: turno.cupos_libres, cantidad_inscriptos: inscriptos, cupos_maximos: cupos });
                const fillPct = porcentajeOcupacion({ cantidad_inscriptos: inscriptos, cupos_maximos: cupos });
                const isLoadingAction = inscribiendo === turno.id_turno;

                return (
                  <View
                    key={turno.id_turno}
                    style={[
                      styles.turnoCard,
                      { backgroundColor: isDark ? palette.slate800 : palette.slate50, borderColor },
                    ]}
                  >
                    <View style={styles.turnoTopRow}>
                      <LinearGradient
                        colors={['#dc2626', '#b91c1c']}
                        style={styles.timePill}
                      >
                        <Text style={styles.timePillStart}>{formatTime(turno.fecha_inicio)}</Text>
                        <Text style={styles.timePillEnd}>{formatTime(turno.fecha_fin)}</Text>
                      </LinearGradient>

                      <View style={styles.turnoInfo}>
                        <Text style={[styles.turnoTitulo, { color: textPrimary }]}>
                          {turno.titulo || turno.serie?.titulo || 'Clase'}
                        </Text>
                        {turno.creador?.nombre_completo ? (
                          <Text style={[styles.turnoProfe, { color: textSecondary }]}>
                            {turno.creador.nombre_completo}
                          </Text>
                        ) : null}
                        {turno.descripcion ? (
                          <Text style={[styles.turnoDesc, { color: textSecondary }]} numberOfLines={2}>
                            {turno.descripcion}
                          </Text>
                        ) : null}

                        <View style={[styles.cupoTrack, { backgroundColor: isDark ? palette.slate700 : palette.slate200 }]}>
                          <View
                            style={[
                              styles.cupoFill,
                              {
                                width: `${fillPct}%`,
                                backgroundColor:
                                  fillPct >= 90
                                    ? palette.error
                                    : fillPct >= 70
                                    ? palette.warning
                                    : palette.success,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.turnoCuposText, { color: textSecondary }]}>
                          {inscriptos}/{cupos} inscriptos
                          {turno.cupos_libres != null && !sinCupos
                            ? ` · ${turno.cupos_libres} libres`
                            : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.turnoBadges}>
                      {inscripto && <Badge label="Inscripto" variant="success" />}
                      {sinCupos && !inscripto && <Badge label="Cupo lleno" variant="warning" />}
                      {turno.cancelado && <Badge label="Cancelado" variant="error" />}
                      {turno.serie && <Badge label="Recurrente" variant="info" />}
                    </View>

                    {/* Botón inscribirse (solo socios/entrenados) */}
                    {!turno.cancelado && canEnrollTurnos() && (
                      <TouchableOpacity
                        style={[
                          styles.inscribirButton,
                          inscripto
                            ? styles.inscribirButtonOutline
                            : sinCupos
                            ? styles.inscribirButtonDisabled
                            : styles.inscribirButtonPrimary,
                        ]}
                        onPress={() => handleInscripcion(turno)}
                        disabled={isLoadingAction || (sinCupos && !inscripto)}
                      >
                        {isLoadingAction ? (
                          <ActivityIndicator
                            size="small"
                            color={inscripto ? palette.success : '#FFFFFF'}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.inscribirText,
                              {
                                color: inscripto
                                  ? palette.success
                                  : sinCupos
                                  ? palette.slate400
                                  : '#FFFFFF',
                              },
                            ]}
                          >
                            {inscripto ? 'Desuscribirme' : sinCupos ? 'Sin cupos' : 'Inscribirme'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Acción staff: ver inscriptos */}
                    {canManageTurnos() && inscriptos > 0 && (
                      <View style={[styles.staffInfo, { borderTopColor: borderColor }]}>
                        <MaterialCommunityIcons name="account-group" size={14} color={textSecondary} />
                        <Text style={[styles.staffInfoText, { color: textSecondary }]}>
                          {inscriptos} {inscriptos === 1 ? 'persona inscripta' : 'personas inscriptas'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  mainCard: { flex: 1, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  cardGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, gap: 12,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  rolePill: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  rolePillText: { color: palette.primary, fontSize: 11, fontWeight: '700' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  todayButton: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  todayButtonText: { color: palette.primary, fontWeight: '700', fontSize: 13 },
  weekNav: { flexDirection: 'row', gap: 4 },
  weekNavButton: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(100,116,139,0.08)',
  },
  daysRow: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  dayChip: {
    minWidth: 62, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 16, borderWidth: 1, backgroundColor: 'transparent',
  },
  dayChipSelected: {
    backgroundColor: palette.primary, borderColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  dayChipToday: { borderStyle: 'dashed' },
  dayName: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dayNumber: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  dayBadge: {
    marginTop: 4, minWidth: 20, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 10, alignItems: 'center',
  },
  dayBadgeText: { fontSize: 10, fontWeight: '800' },
  dayHeader: {
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectedDayTitle: { fontSize: 15, fontWeight: '800' },
  turnosCount: { fontSize: 13 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 180 },
  turnosContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  turnoCard: { borderRadius: 18, borderWidth: 1, padding: 14 },
  turnoTopRow: { flexDirection: 'row', gap: 12 },
  timePill: {
    width: 72, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  timePillStart: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  timePillEnd: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  turnoInfo: { flex: 1 },
  turnoTitulo: { fontSize: 16, fontWeight: '800' },
  turnoProfe: { fontSize: 13, marginTop: 2 },
  turnoDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  cupoTrack: {
    height: 6, borderRadius: 999, marginTop: 10, overflow: 'hidden',
  },
  cupoFill: { height: '100%', borderRadius: 999 },
  turnoCuposText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  turnoBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  inscribirButton: {
    marginTop: 12, paddingVertical: 12, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  inscribirButtonPrimary: { backgroundColor: palette.primary },
  inscribirButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.success },
  inscribirButtonDisabled: { backgroundColor: palette.slate200 },
  inscribirText: { fontSize: 14, fontWeight: '700' },
  staffInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 10,
  },
  staffInfoText: { fontSize: 12 },
});
