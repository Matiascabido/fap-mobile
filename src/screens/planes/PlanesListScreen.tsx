import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { PlanWithRelations } from '../../types/planes.types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
import { useDebounce } from '../../hooks/useDebounce';
import PlanListCard from '../../components/planes/PlanListCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activos' | 'finalizados';

export default function PlanesListScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const { canManagePlanes } = usePermissions();
  const canManage = canManagePlanes();

  const [planes, setPlanes] = useState<PlanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');

  const debouncedSearch = useDebounce(search, 400);

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
        const objetivo = p.plan?.objetivo_semanal?.toLowerCase() || '';
        const tipo = p.plan?.tipo_plan?.nombre_tipo?.toLowerCase() || '';
        const buscarEnAsignaciones = p.asignaciones?.some((a) => {
          const socio = (a.nombre_socio || `${a.socio?.nombre ?? ''} ${a.socio?.apellido ?? ''}`).toLowerCase();
          const prof = (a.nombre_profesional || `${a.profesional?.nombre ?? ''} ${a.profesional?.apellido ?? ''}`).toLowerCase();
          return socio.includes(term) || prof.includes(term);
        });
        return nombrePlan.includes(term) || objetivo.includes(term) || tipo.includes(term) || buscarEnAsignaciones;
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
    ({ item }: { item: PlanWithRelations }) => (
      <PlanListCard
        item={item}
        onPress={() => navigation.navigate('PlanDetail', { planId: item.plan.id })}
      />
    ),
    [navigation]
  );

  const filterLabels: Record<EstadoFilter, string> = {
    todos: 'Todos',
    activos: 'Activos',
    finalizados: 'Finalizados',
  };

  if (loading) {
    return <Loader fullscreen message="Cargando planes..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <FlatList
        data={filteredPlanes}
        renderItem={renderPlan}
        keyExtractor={(item) => item.plan.id}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text style={[styles.heroEyebrow, { color: palette.primary }]}>Catálogo</Text>
              <Text style={[styles.heroTitle, typography.title2, { color: colors.label }]}>
                Gestión de planes
              </Text>
              <Text style={[styles.heroSub, { color: colors.secondaryLabel }]}>
                Rutinas, bloques y entrenamientos con una vista clara de cada plan.
              </Text>
            </View>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.secondaryGroupedBackground,
                  borderColor: colors.separator,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.secondaryLabel} />
              <TextInput
                placeholder="Buscar por nombre, objetivo, tipo o asignación…"
                placeholderTextColor={colors.tertiaryLabel}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, typography.body, { color: colors.label }]}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {search.length > 0 && Platform.OS === 'android' ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={[styles.segmented, { backgroundColor: colors.tertiaryGroupedBackground }]}>
              {(['todos', 'activos', 'finalizados'] as EstadoFilter[]).map((filter) => {
                const isActive = estadoFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.segment,
                      isActive && {
                        backgroundColor: palette.primary,
                        ...Platform.select({
                          ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.12,
                            shadowRadius: 2,
                          },
                          android: { elevation: 2 },
                        }),
                      },
                    ]}
                    onPress={() => setEstadoFilter(filter)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: isActive ? '#FFFFFF' : colors.secondaryLabel,
                          fontWeight: isActive ? '600' : '500',
                        },
                      ]}
                    >
                      {filterLabels[filter]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.count, typography.footnote, { color: colors.secondaryLabel }]}>
              {filteredPlanes.length} plan{filteredPlanes.length === 1 ? '' : 'es'}
            </Text>
          </View>
        }
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
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  hero: {
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
  },
  count: {
    marginBottom: 8,
    marginLeft: 4,
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
