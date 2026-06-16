import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
} from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { turneroService } from '../../services/api/turnero.service';
import { HttpRequestError, UnauthorizedSessionError } from '../../services/api/http';
import { TurnoResponse } from '../../types/turnero.types';
import { weekRangeQueryParams } from '../../utils/dateRange';
import CrearTurnoModal from '../../components/turnero/CrearTurnoModal';
import TurnoDetailModal from '../../components/turnero/TurnoDetailModal';
import { mapTurnoToDetalle } from '../../utils/turnoMapper';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
import { formatTime, capitalize } from '../../utils/formatters';
import { turnoSinCupo, porcentajeOcupacion } from '../../utils/turneroCupo';
import {
  estaInscriptoEnTurno,
  hydrateTurnoInscripciones,
  syncTurnoInscripcionesFromList,
} from '../../utils/turnoInscripcion';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useNotifications } from '../../hooks/useNotifications';

function puedeMostrarInscripcion(turno: TurnoResponse, inscripto: boolean): boolean {
  return !turno.cancelado && (!turnoSinCupo(turno) || inscripto);
}

export default function TurneroScreen() {
  const { colors } = useAppTheme();
  const screenBg = useScreenBackground();
  const { user } = useAuth();
  const { canEnrollTurnos, canManageTurnos, isProfesionalUser } = usePermissions();
  const canEnroll = canEnrollTurnos();
  const canManage = canManageTurnos();
  const { refreshNotifications } = useNotifications();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showCrearTurno, setShowCrearTurno] = useState(false);
  const [inscribiendo, setInscribiendo] = useState<string | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<TurnoResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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
  const userId = user?.id;

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const checkInscripto = useCallback(
    (turno: TurnoResponse) => estaInscriptoEnTurno(turno, userId, userEmail),
    [userId, userEmail]
  );

  const loadTurnos = useCallback(async () => {
    setLoadError('');
    try {
      if (userId) await hydrateTurnoInscripciones(userId);

      const range = weekRangeQueryParams(weekStart, weekEnd);
      const params: Record<string, string> = {
        desde: range.desde,
        hasta: range.hasta,
      };

      if (!canManage) {
        if (canEnroll && userEmail) {
          params.email_socio = userEmail;
        } else if (isProfesionalUser && userEmail) {
          params.email_profesional = userEmail;
        }
      }

      const data = await turneroService.list(params);
      await syncTurnoInscripcionesFromList(data, userId, userEmail);
      setTurnos(data);
    } catch (error) {
      if (error instanceof UnauthorizedSessionError) {
        setLoadError('Tu sesión expiró. Volvé a iniciar sesión.');
      } else if (error instanceof HttpRequestError) {
        setLoadError(error.message);
      } else {
        const msg = error instanceof Error ? error.message : 'No se pudieron cargar los turnos.';
        setLoadError(msg);
      }
      setTurnos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart, weekEnd, canEnroll, canManage, isProfesionalUser, userEmail, userId]);

  useEffect(() => {
    setLoading(true);
    loadTurnos();
  }, [weekKey, loadTurnos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTurnos();
    void refreshNotifications(true);
  }, [loadTurnos, refreshNotifications]);

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
        /* ignore */
      }
    }
    return map;
  }, [turnos]);

  const handleInscripcion = async (turno: TurnoResponse) => {
    const inscripto = checkInscripto(turno);
    setInscribiendo(turno.id_turno);
    try {
      const fresh = await turneroService.toggleInscripcion(
        turno.id_turno,
        inscripto,
        userId
      );
      setTurnos((prev) =>
        prev.map((t) => (t.id_turno === fresh.id_turno ? fresh : t))
      );
      if (selectedTurno?.id_turno === turno.id_turno) {
        setSelectedTurno(fresh);
      }
      await syncTurnoInscripcionesFromList([fresh], userId, userEmail);
    } catch (err: any) {
      Alert.alert(
        'Inscripción',
        err?.message || 'No se pudo completar la inscripción. Intentá de nuevo.'
      );
    } finally {
      setInscribiendo(null);
    }
  };

  const openDetail = (turno: TurnoResponse) => {
    setSelectedTurno(turno);
    setShowDetail(true);
  };

  const handleDeleteTurno = (id: string) => {
    Alert.alert('Eliminar turno', '¿Confirmás que querés eliminar este turno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await turneroService.delete(id);
            setShowDetail(false);
            setSelectedTurno(null);
            await loadTurnos();
          } catch {
            /* interceptor */
          }
        },
      },
    ]);
  };

  const detailVista = useMemo(() => {
    if (!selectedTurno) return null;
    return mapTurnoToDetalle(selectedTurno, checkInscripto(selectedTurno));
  }, [selectedTurno, checkInscripto]);

  const renderDayChip = (day: Date) => {
    const isSelected = isSameDay(day, selectedDay);
    const isToday = isSameDay(day, new Date());
    const dayKey = format(day, 'yyyy-MM-dd');
    const count = turnosPorDia.get(dayKey) || 0;

    return (
      <TouchableOpacity
        key={dayKey}
        style={[
          styles.dayChip,
          {
            backgroundColor: isSelected
              ? colors.tint
              : colors.secondaryGroupedBackground,
            borderColor: isToday && !isSelected ? colors.tint : colors.separator,
          },
        ]}
        onPress={() => setSelectedDay(day)}
      >
        <Text
          style={[
            styles.dayName,
            { color: isSelected ? '#FFFFFF' : colors.secondaryLabel },
          ]}
        >
          {capitalize(format(day, 'EEE', { locale: es })).slice(0, 3)}
        </Text>
        <Text
          style={[styles.dayNumber, { color: isSelected ? '#FFFFFF' : colors.label }]}
        >
          {format(day, 'd')}
        </Text>
        {count > 0 ? (
          <View
            style={[
              styles.dayDot,
              {
                backgroundColor: isSelected ? 'rgba(255,255,255,0.9)' : colors.tint,
              },
            ]}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderTurnoItem = ({ item: turno, index }: { item: TurnoResponse; index: number }) => {
    const inscripto = checkInscripto(turno);
    const inscriptos = turno.cantidad_inscriptos ?? 0;
    const cupos = turno.cupos_maximos ?? 0;
    const sinCupos = turnoSinCupo({
      cupos_libres: turno.cupos_libres,
      cantidad_inscriptos: inscriptos,
      cupos_maximos: cupos,
    });
    const fillPct = porcentajeOcupacion({ cantidad_inscriptos: inscriptos, cupos_maximos: cupos });
    const isLoadingAction = inscribiendo === turno.id_turno;
    const showEnroll = canEnroll && puedeMostrarInscripcion(turno, inscripto);
    const isLast = index === turnosDelDia.length - 1;

    return (
      <View
        style={[
          styles.turnoRow,
          {
            backgroundColor: colors.secondaryGroupedBackground,
            borderBottomColor: colors.separator,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
          inscripto && { backgroundColor: `${colors.tint}06` },
        ]}
      >
        <Pressable
          style={styles.turnoMain}
          onPress={() => openDetail(turno)}
          android_ripple={{ color: colors.fill }}
        >
          <View style={[styles.timeBlock, { backgroundColor: `${colors.tint}12` }]}>
            <Text style={[styles.timeStart, { color: colors.tint }]}>
              {formatTime(turno.fecha_inicio)}
            </Text>
            <Text style={[styles.timeEnd, { color: colors.secondaryLabel }]}>
              {formatTime(turno.fecha_fin)}
            </Text>
          </View>

          <View style={styles.turnoBody}>
            <Text style={[styles.turnoTitulo, typography.headline, { color: colors.label }]} numberOfLines={1}>
              {turno.titulo || turno.serie?.titulo || 'Clase'}
            </Text>
            {turno.creador?.nombre_completo ? (
              <Text style={[styles.turnoSub, { color: colors.secondaryLabel }]} numberOfLines={1}>
                {turno.creador.nombre_completo}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.cupoText, { color: colors.secondaryLabel }]}>
                {inscriptos}/{cupos || '—'} inscriptos
              </Text>
              {inscripto ? <Badge label="Inscripto" variant="success" /> : null}
              {sinCupos && !inscripto ? <Badge label="Lleno" variant="warning" /> : null}
              {turno.cancelado ? <Badge label="Cancelado" variant="error" /> : null}
            </View>

            {cupos > 0 ? (
              <View style={[styles.cupoTrack, { backgroundColor: colors.fill }]}>
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
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
        </Pressable>

        {showEnroll ? (
          <TouchableOpacity
            style={[
              styles.enrollBtn,
              inscripto
                ? { borderColor: palette.success, backgroundColor: `${palette.success}10` }
                : { backgroundColor: colors.tint },
              isLoadingAction && styles.btnDisabled,
            ]}
            onPress={() => void handleInscripcion(turno)}
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <ActivityIndicator size="small" color={inscripto ? palette.success : '#FFF'} />
            ) : (
              <>
                <Ionicons
                  name={inscripto ? 'checkmark-circle' : 'add-circle-outline'}
                  size={18}
                  color={inscripto ? palette.success : '#FFF'}
                />
                <Text
                  style={[
                    styles.enrollBtnText,
                    { color: inscripto ? palette.success : '#FFF' },
                  ]}
                >
                  {inscripto ? 'Desuscribirme' : 'Inscribirme'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const listHeader = (
    <>
      <View style={[styles.weekHeader, { backgroundColor: screenBg }]}>
        <View style={styles.weekTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.label }]}>Turnero</Text>
            <Text style={[styles.weekRange, { color: colors.secondaryLabel }]}>
              {capitalize(format(weekStart, 'd MMM', { locale: es }))} –{' '}
              {capitalize(format(weekEnd, 'd MMM yyyy', { locale: es }))}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.todayBtn, { backgroundColor: `${colors.tint}12` }]}
            onPress={goToToday}
          >
            <Text style={[styles.todayBtnText, { color: colors.tint }]}>Hoy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekNavRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.secondaryGroupedBackground }]}
            onPress={() => setCurrentWeek((w) => subWeeks(w, 1))}
          >
            <Ionicons name="chevron-back" size={20} color={colors.label} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.secondaryGroupedBackground }]}
            onPress={() => setCurrentWeek((w) => addWeeks(w, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.label} />
          </TouchableOpacity>
          {canManage ? (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
              onPress={() => setShowCrearTurno(true)}
            >
              <Ionicons name="add" size={22} color="#FFF" />
              <Text style={styles.addBtnText}>Nueva clase</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {weekDays.map(renderDayChip)}
        </ScrollView>
      </View>

      <View style={[styles.daySection, { backgroundColor: screenBg }]}>
        <Text style={[styles.dayTitle, typography.headline, { color: colors.label }]}>
          {capitalize(format(selectedDay, "EEEE d 'de' MMMM", { locale: es }))}
        </Text>
        <Text style={[styles.dayCount, { color: colors.secondaryLabel }]}>
          {turnosDelDia.length === 0
            ? 'Sin clases este día'
            : `${turnosDelDia.length} ${turnosDelDia.length === 1 ? 'clase' : 'clases'}`}
        </Text>
      </View>

      {loadError ? (
        <View style={[styles.errorBox, { backgroundColor: `${palette.error}12` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={palette.error} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      {canEnroll && !canManage ? (
        <Text style={[styles.hintText, { color: colors.secondaryLabel }]}>
          Tocá una clase para ver el detalle o usá el botón para inscribirte.
        </Text>
      ) : null}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          {listHeader}
          <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={turnosDelDia}
          keyExtractor={(t) => t.id_turno}
          renderItem={renderTurnoItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View
              style={[
                styles.emptyWrap,
                { backgroundColor: colors.secondaryGroupedBackground },
              ]}
            >
              <EmptyState
                icon="calendar-blank"
                title="Sin turnos"
                message="No hay clases programadas para este día"
              />
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <CrearTurnoModal
        visible={showCrearTurno}
        selectedDay={selectedDay}
        onClose={() => setShowCrearTurno(false)}
        onCreated={loadTurnos}
      />

      <TurnoDetailModal
        visible={showDetail}
        turno={detailVista}
        canEnroll={canEnroll}
        canManage={canManage}
        inscripcionEnProceso={!!inscribiendo && inscribiendo === selectedTurno?.id_turno}
        onClose={() => {
          setShowDetail(false);
          setSelectedTurno(null);
        }}
        onToggleSubscription={(id) => {
          const t = turnos.find((x) => x.id_turno === id) ?? selectedTurno;
          if (t) void handleInscripcion(t);
        }}
        onDelete={canManage ? handleDeleteTurno : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1 },
  listContent: { paddingBottom: 32 },
  weekHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  weekTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  screenTitle: { fontSize: 28, fontWeight: '700' },
  weekRange: { fontSize: 14, marginTop: 2 },
  todayBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  todayBtnText: { fontSize: 14, fontWeight: '700' },
  weekNavRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    marginLeft: 4,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  daysRow: { gap: 8, paddingBottom: 8 },
  dayChip: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dayNumber: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  daySection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  dayTitle: { fontSize: 17 },
  dayCount: { fontSize: 13, marginTop: 2 },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { flex: 1, color: palette.error, fontSize: 13 },
  emptyWrap: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  turnoRow: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  turnoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  timeBlock: {
    width: 64,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timeStart: { fontSize: 15, fontWeight: '800' },
  timeEnd: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  turnoBody: { flex: 1, minWidth: 0 },
  turnoTitulo: { fontSize: 17 },
  turnoSub: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  cupoText: { fontSize: 12, fontWeight: '600' },
  cupoTrack: { height: 4, borderRadius: 999, marginTop: 8, overflow: 'hidden' },
  cupoFill: { height: '100%', borderRadius: 999 },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  enrollBtnText: { fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
