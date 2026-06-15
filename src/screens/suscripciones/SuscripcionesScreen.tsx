import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  suscripcionesService,
  suscripcionSocio,
  suscripcionProfesional,
  nombreParticipante,
  calcularEstadoSuscripcion,
  diasHastaVencimiento,
  CreateSuscripcionDTO,
} from '../../services/api/suscripciones.service';
import { suscripcionDetalleService, SuscripcionDetalle } from '../../services/api/suscripcionDetalle.service';
import { sociosService } from '../../services/api/socios.service';
import { SuscripcionData, SuscripcionEstado } from '../../types/suscripciones.types';
import { Socio } from '../../types/socios.types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserId } from '../../utils/userId';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatCurrency, toIsoDateString } from '../../utils/formatters';
import DatePickerField from '../../components/common/DatePickerField';
import { matchSearch } from '../../utils/searchNormalize';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type Filter = 'todas' | 'vigente' | 'por_vencer' | 'vencida';

const ESTADO_CONFIG: Record<
  SuscripcionEstado,
  { label: string; variant: 'success' | 'warning' | 'error' }
> = {
  vigente: { label: 'Vigente', variant: 'success' },
  por_vencer: { label: 'Por vencer', variant: 'warning' },
  vencida: { label: 'Vencida', variant: 'error' },
};

// Fecha mínima para vencimiento = mañana
function fechaMinimaDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fechaMinima(): string {
  return toIsoDateString(fechaMinimaDate());
}

// ─── Modal Crear Suscripción ─────────────────────────────────────────────────

interface CrearSuscripcionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  profesionalId?: string;
}

function CrearSuscripcionModal({
  visible,
  onClose,
  onCreated,
  profesionalId,
}: CrearSuscripcionModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [detalles, setDetalles] = useState<SuscripcionDetalle[]>([]);
  const [socioSel, setSocioSel] = useState('');
  const [detalleSel, setDetalleSel] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [profId, setProfId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchSocio, setSearchSocio] = useState('');

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;

  useEffect(() => {
    if (visible) {
      setProfId(profesionalId ?? getUserId(user));
      setLoadingData(true);
      Promise.all([
        sociosService.getSocios().catch(() => []),
        suscripcionDetalleService.getAll().catch(() => []),
      ])
        .then(([s, d]) => {
          setSocios(s);
          setDetalles(d);
        })
        .finally(() => setLoadingData(false));
    }
  }, [visible, profesionalId, user]);

  const reset = () => {
    setSocioSel('');
    setDetalleSel('');
    setFechaVenc('');
    setSearchSocio('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const filteredSocios = useMemo(
    () =>
      searchSocio.trim()
        ? socios.filter(
            (s) =>
              matchSearch(s.nombre, searchSocio) ||
              matchSearch(s.email, searchSocio) ||
              matchSearch(s.dni, searchSocio)
          )
        : socios,
    [socios, searchSocio]
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!socioSel) errs.socio = 'Seleccioná un socio';
    if (!detalleSel) errs.detalle = 'Seleccioná un plan';
    if (!fechaVenc) errs.fecha = 'Ingresá la fecha de vencimiento';
    else if (fechaVenc < fechaMinima()) errs.fecha = 'La fecha debe ser al menos mañana';
    if (!profId) errs.prof = 'Falta el profesional asignado';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    const dto: CreateSuscripcionDTO = {
      id_usuario: socioSel,
      id_suscripcion_detalle: detalleSel,
      fecha_vencimiento: fechaVenc,
      id_usuario_profesional: profId,
    };
    try {
      await suscripcionesService.create(dto);
      Alert.alert('Éxito', 'Suscripción creada correctamente.');
      handleClose();
      onCreated();
    } catch {
      // Error manejado por interceptor
    } finally {
      setLoading(false);
    }
  };

  const socioNombre = socios.find((s) => s.id === socioSel)?.nombre ?? '';
  const detalleNombre = detalles.find((d) => d.id === detalleSel)?.nombre ?? '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <MaterialCommunityIcons name="card-plus" size={20} color={palette.primary} />
            </View>
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>Nueva suscripción</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {loadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.primary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Cargando datos...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Socio */}
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Socio *</Text>
              <View style={[styles.searchInputWrap, { backgroundColor: inputBg, borderColor: errors.socio ? palette.error : borderColor }]}>
                <MaterialCommunityIcons name="magnify" size={16} color={textSecondary} />
                <TextInput
                  style={[styles.searchInputInner, { color: textPrimary }]}
                  placeholder="Buscar socio..."
                  placeholderTextColor={textSecondary}
                  value={searchSocio}
                  onChangeText={setSearchSocio}
                />
              </View>
              {errors.socio ? <Text style={styles.fieldError}>{errors.socio}</Text> : null}
              <ScrollView
                style={styles.selectorList}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {filteredSocios.slice(0, 30).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.selectorItem,
                      { borderColor: socioSel === s.id ? palette.primary : borderColor },
                      socioSel === s.id && { backgroundColor: `${palette.primary}15` },
                    ]}
                    onPress={() => { setSocioSel(s.id); setErrors((e) => ({ ...e, socio: '' })); }}
                  >
                    <MaterialCommunityIcons
                      name={socioSel === s.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={18}
                      color={socioSel === s.id ? palette.primary : textSecondary}
                    />
                    <Text style={[styles.selectorItemText, { color: textPrimary }]}>{s.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Plan/detalle */}
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Plan *</Text>
              {errors.detalle ? <Text style={styles.fieldError}>{errors.detalle}</Text> : null}
              {detalles.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.selectorItem,
                    { borderColor: detalleSel === d.id ? palette.primary : borderColor },
                    detalleSel === d.id && { backgroundColor: `${palette.primary}15` },
                  ]}
                  onPress={() => { setDetalleSel(d.id); setErrors((e) => ({ ...e, detalle: '' })); }}
                >
                  <MaterialCommunityIcons
                    name={detalleSel === d.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={18}
                    color={detalleSel === d.id ? palette.primary : textSecondary}
                  />
                  <View style={styles.selectorItemInfo}>
                    <Text style={[styles.selectorItemText, { color: textPrimary }]}>{d.nombre}</Text>
                    {d.precio ? (
                      <Text style={[styles.selectorItemSub, { color: textSecondary }]}>
                        {formatCurrency(Number(d.precio))}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Fecha vencimiento */}
              <DatePickerField
                label="Fecha de vencimiento *"
                value={fechaVenc}
                onChange={(v) => {
                  setFechaVenc(v);
                  setErrors((e) => ({ ...e, fecha: '' }));
                }}
                error={errors.fecha}
                minimumDate={fechaMinimaDate()}
                hint={`Mínimo: ${formatDate(fechaMinima())}`}
                placeholder="Elegí la fecha de vencimiento"
              />

              {errors.prof ? <Text style={styles.fieldError}>{errors.prof}</Text> : null}

              {/* Resumen */}
              {(socioNombre || detalleNombre) && (
                <View style={[styles.resumen, { backgroundColor: `${palette.success}12`, borderColor: `${palette.success}30` }]}>
                  <Text style={[styles.resumenTitle, { color: palette.success }]}>Resumen</Text>
                  {socioNombre ? (
                    <Text style={[styles.resumenLine, { color: textPrimary }]}>Socio: {socioNombre}</Text>
                  ) : null}
                  {detalleNombre ? (
                    <Text style={[styles.resumenLine, { color: textPrimary }]}>Plan: {detalleNombre}</Text>
                  ) : null}
                  {fechaVenc ? (
                    <Text style={[styles.resumenLine, { color: textPrimary }]}>
                      Vence: {formatDate(fechaVenc)}
                    </Text>
                  ) : null}
                </View>
              )}
            </ScrollView>
          )}

          <View style={[styles.sheetFooter, { borderTopColor: borderColor }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (loading || loadingData) && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={loading || loadingData}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Crear suscripción</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Pantalla Principal ──────────────────────────────────────────────────────

export default function SuscripcionesScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { hasPermission, isProfesionalUser, isAdminUser } = usePermissions();

  const [suscripciones, setSuscripciones] = useState<SuscripcionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');
  const [showCrear, setShowCrear] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const canCreate = hasPermission('suscripciones:create');

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const loadSuscripciones = useCallback(async () => {
    try {
      const data = await suscripcionesService.getAll({ limit: 200 });
      setSuscripciones(data);
    } catch (error) {
      console.error('Error loading suscripciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuscripciones();
  }, [loadSuscripciones]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSuscripciones();
  }, [loadSuscripciones]);

  const alertasCount = useMemo(() => {
    return suscripciones.filter((s) => {
      const estado = calcularEstadoSuscripcion(s);
      return estado === 'por_vencer' || estado === 'vencida';
    }).length;
  }, [suscripciones]);

  const filteredSuscripciones = useMemo(() => {
    let result = suscripciones;

    if (debouncedSearch.trim()) {
      result = result.filter((s) => {
        const socio = nombreParticipante(suscripcionSocio(s));
        const plan = s.suscripcion_detalle?.nombre ?? '';
        return matchSearch(socio, debouncedSearch) || matchSearch(plan, debouncedSearch);
      });
    }

    if (filter !== 'todas') {
      result = result.filter((s) => calcularEstadoSuscripcion(s) === filter);
    }

    return [...result].sort((a, b) => diasHastaVencimiento(a) - diasHastaVencimiento(b));
  }, [suscripciones, debouncedSearch, filter]);

  const renderSuscripcion = useCallback(
    ({ item }: { item: SuscripcionData }) => {
      const socio = suscripcionSocio(item);
      const profesional = suscripcionProfesional(item);
      const estado = calcularEstadoSuscripcion(item);
      const dias = diasHastaVencimiento(item);
      const config = ESTADO_CONFIG[estado];
      const precio = parseFloat(item.suscripcion_detalle?.precio || '0');

      return (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Avatar nombre={socio?.nombre ?? ''} apellido={socio?.apellido ?? ''} size={44} />
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.socioNombre, { color: textPrimary }]} numberOfLines={1}>
                {nombreParticipante(socio)}
              </Text>
              <Text style={[styles.planNombre, { color: textSecondary }]} numberOfLines={1}>
                {item.suscripcion_detalle?.nombre || 'Plan'}
              </Text>
            </View>
            <Badge label={config.label} variant={config.variant} />
          </View>

          <View style={[styles.cardDivider, { backgroundColor: borderColor }]} />

          <View style={styles.cardBody}>
            <View style={styles.cardBodyItem}>
              <Text style={[styles.bodyLabel, { color: textSecondary }]}>Vencimiento</Text>
              <Text style={[styles.bodyValue, { color: textPrimary }]}>
                {formatDate(item.fecha_vencimiento)}
              </Text>
              <Text
                style={[
                  styles.diasText,
                  {
                    color:
                      estado === 'vencida'
                        ? palette.error
                        : estado === 'por_vencer'
                        ? palette.warning
                        : palette.success,
                  },
                ]}
              >
                {estado === 'vencida'
                  ? `Venció hace ${Math.abs(dias)} días`
                  : dias === 0
                  ? 'Vence hoy'
                  : `${dias} días restantes`}
              </Text>
            </View>
            <View style={styles.cardBodyItem}>
              <Text style={[styles.bodyLabel, { color: textSecondary }]}>Precio</Text>
              <Text style={[styles.bodyValue, { color: palette.primary, fontWeight: '700' }]}>
                {precio > 0 ? formatCurrency(precio) : '—'}
              </Text>
            </View>
          </View>

          {profesional ? (
            <View style={styles.profeRow}>
              <MaterialCommunityIcons name="whistle" size={14} color={textSecondary} />
              <Text style={[styles.profeText, { color: textSecondary }]}>
                {nombreParticipante(profesional)}
              </Text>
            </View>
          ) : null}
        </Card>
      );
    },
    [textPrimary, textSecondary, borderColor]
  );

  if (loading) {
    return <Loader fullscreen message="Cargando suscripciones..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {alertasCount > 0 && (
        <View style={styles.alertBanner}>
          <MaterialCommunityIcons name="alert" size={20} color="#FFFFFF" />
          <Text style={styles.alertText}>
            {alertasCount} {alertasCount === 1 ? 'suscripción requiere' : 'suscripciones requieren'}{' '}
            atención
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
          <TextInput
            placeholder="Buscar por socio o plan"
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

        <View style={styles.filters}>
          {(['todas', 'vigente', 'por_vencer', 'vencida'] as Filter[]).map((f) => {
            const isActive = filter === f;
            const labels: Record<Filter, string> = {
              todas: 'Todas',
              vigente: 'Vigentes',
              por_vencer: 'Por vencer',
              vencida: 'Vencidas',
            };
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? palette.primary : cardBg, borderColor: isActive ? palette.primary : borderColor },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : textSecondary }]}>
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredSuscripciones}
        renderItem={renderSuscripcion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="card-account-details-outline"
            title="Sin suscripciones"
            message="No se encontraron suscripciones con los filtros aplicados"
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* FAB crear suscripción */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCrear(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <CrearSuscripcionModal
        visible={showCrear}
        onClose={() => setShowCrear(false)}
        onCreated={loadSuscripciones}
        profesionalId={
          isProfesionalUser && !isAdminUser ? getUserId(user) : getUserId(user) || undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.warning,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  alertText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  socioNombre: { fontSize: 16, fontWeight: '600' },
  planNombre: { fontSize: 13, marginTop: 2 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBodyItem: { flex: 1 },
  bodyLabel: { fontSize: 12, textTransform: 'uppercase' },
  bodyValue: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  diasText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  profeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  profeText: { fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, paddingHorizontal: 12, height: 40, marginBottom: 8,
  },
  searchInputInner: { flex: 1, fontSize: 14, marginLeft: 8 },
  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.3)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  sheetIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 8 },
  sheetFooter: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1,
  },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600',
    marginBottom: 6, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldError: { fontSize: 12, color: palette.error, marginTop: 4 },
  input: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  fechaHint: { fontSize: 12, marginTop: 4 },
  selectorList: { maxHeight: 200, marginBottom: 4 },
  selectorItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6,
  },
  selectorItemText: { fontSize: 14, fontWeight: '500', flex: 1 },
  selectorItemInfo: { flex: 1 },
  selectorItemSub: { fontSize: 12, marginTop: 2 },
  resumen: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 16,
  },
  resumenTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  resumenLine: { fontSize: 14, marginBottom: 2 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: 14, backgroundColor: 'rgba(100,116,139,0.1)',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  submitBtn: {
    flex: 2, paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', borderRadius: 14, backgroundColor: palette.primary, minHeight: 48,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
