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
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { PlanWithRelations } from '../../types/planes.types';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activos' | 'finalizados';

export default function PlanesListScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { isProfesionalUser, isAdminUser } = usePermissions();
  const canManage = isProfesionalUser || isAdminUser;

  const [planes, setPlanes] = useState<PlanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');

  const debouncedSearch = useDebounce(search, 400);

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const loadPlanes = useCallback(async () => {
    try {
      const data = await planesService.getAll();
      setPlanes(data);
    } catch (error) {
      console.error('Error loading planes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlanes();
  }, [loadPlanes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlanes();
  }, [loadPlanes]);

  const filteredPlanes = useMemo(() => {
    let result = planes;

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim();
      result = result.filter((p) => {
        const nombrePlan = p.plan?.nombre_plan?.toLowerCase() || '';
        const nombreSocio = p.asignaciones?.[0]?.nombre_socio?.toLowerCase() || '';
        return nombrePlan.includes(term) || nombreSocio.includes(term);
      });
    }

    if (estadoFilter !== 'todos') {
      result = result.filter((p) => {
        const isActive = p.activo ?? p.asignaciones?.some((a) => a.activo);
        return estadoFilter === 'activos' ? isActive : !isActive;
      });
    }

    return result;
  }, [planes, debouncedSearch, estadoFilter]);

  const renderPlan = useCallback(
    ({ item }: { item: PlanWithRelations }) => {
      const plan = item.plan;
      const asignacion = item.asignaciones?.[0];
      const isActive = item.activo ?? item.asignaciones?.some((a) => a.activo) ?? false;
      const nombreSocio =
        asignacion?.nombre_socio ||
        (asignacion?.socio
          ? `${asignacion.socio.nombre ?? ''} ${asignacion.socio.apellido ?? ''}`.trim()
          : null);
      const nombreProfesional =
        asignacion?.nombre_profesional ||
        (asignacion?.profesional
          ? `${asignacion.profesional.nombre ?? ''} ${asignacion.profesional.apellido ?? ''}`.trim()
          : null);
      const numBloques = item.bloques?.length || 0;

      return (
        <TouchableOpacity
          style={[styles.planCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
          activeOpacity={0.7}
        >
          <View style={styles.planHeader}>
            <View style={styles.planIconContainer}>
              <MaterialCommunityIcons name="dumbbell" size={24} color={palette.primary} />
            </View>
            <View style={styles.planHeaderInfo}>
              <Text style={[styles.planNombre, { color: textPrimary }]} numberOfLines={1}>
                {plan.nombre_plan}
              </Text>
              {plan.tipo_plan?.nombre_tipo ? (
                <Text style={[styles.planTipo, { color: textSecondary }]}>
                  {plan.tipo_plan.nombre_tipo}
                </Text>
              ) : null}
            </View>
            <Badge
              label={isActive ? 'Activo' : 'Finalizado'}
              variant={isActive ? 'success' : 'neutral'}
            />
          </View>

          <View style={styles.planBody}>
            {nombreSocio ? (
              <View style={styles.planRow}>
                <MaterialCommunityIcons name="account" size={14} color={textSecondary} />
                <Text style={[styles.planRowText, { color: textSecondary }]} numberOfLines={1}>
                  {nombreSocio}
                </Text>
              </View>
            ) : null}
            {nombreProfesional ? (
              <View style={styles.planRow}>
                <MaterialCommunityIcons name="whistle" size={14} color={textSecondary} />
                <Text style={[styles.planRowText, { color: textSecondary }]} numberOfLines={1}>
                  Prof: {nombreProfesional}
                </Text>
              </View>
            ) : null}
            <View style={styles.planRow}>
              <MaterialCommunityIcons name="view-grid" size={14} color={textSecondary} />
              <Text style={[styles.planRowText, { color: textSecondary }]}>
                {numBloques} {numBloques === 1 ? 'bloque' : 'bloques'}
                {plan.semanas ? ` · ${plan.semanas} semanas` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [cardBg, borderColor, textPrimary, textSecondary, navigation]
  );

  if (loading) {
    return <Loader fullscreen message="Cargando planes..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
          <TextInput
            placeholder="Buscar por plan o socio"
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filters}>
          {(['todos', 'activos', 'finalizados'] as EstadoFilter[]).map((filter) => {
            const isActive = estadoFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? palette.primary : cardBg,
                    borderColor: isActive ? palette.primary : borderColor,
                  },
                ]}
                onPress={() => setEstadoFilter(filter)}
              >
                <Text
                  style={[styles.filterText, { color: isActive ? '#FFFFFF' : textSecondary }]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredPlanes}
        renderItem={renderPlan}
        keyExtractor={(item) => item.plan.id}
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
            icon="dumbbell"
            title="Sin planes"
            message="No se encontraron planes con los filtros aplicados"
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {canManage && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PlanForm', {})}
          accessibilityLabel="Crear plan"
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  filters: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    flexGrow: 1,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  planNombre: {
    fontSize: 16,
    fontWeight: '700',
  },
  planTipo: {
    fontSize: 13,
    marginTop: 2,
  },
  planBody: {
    marginTop: 12,
    gap: 6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planRowText: {
    fontSize: 13,
    flex: 1,
  },
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
