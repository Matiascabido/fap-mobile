import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  suscripcionesService,
  suscripcionSocio,
  suscripcionProfesional,
  nombreParticipante,
  calcularEstadoSuscripcion,
  diasHastaVencimiento,
} from '../../services/api/suscripciones.service';
import { SuscripcionData, SuscripcionEstado } from '../../types/suscripciones.types';
import { useTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { getUserId } from '../../utils/userId';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { fechaVencimientoSuscripcion } from '../../utils/suscripcionFecha';
import { matchSearch } from '../../utils/searchNormalize';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import CrearSuscripcionModal from '../../components/suscripciones/CrearSuscripcionModal';

type Filter = 'todas' | 'vigente' | 'por_vencer' | 'vencida';

const ESTADO_CONFIG: Record<
  SuscripcionEstado,
  { label: string; variant: 'success' | 'warning' | 'error' }
> = {
  vigente: { label: 'Vigente', variant: 'success' },
  por_vencer: { label: 'Por vencer', variant: 'warning' },
  vencida: { label: 'Vencida', variant: 'error' },
};

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

  const bgColor = useScreenBackground();
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
      const fechaVenc = fechaVencimientoSuscripcion(item);
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
                {formatDate(fechaVenc)}
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

});
