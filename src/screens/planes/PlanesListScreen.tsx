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
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import PlanListCard from '../../components/planes/PlanListCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activos' | 'finalizados';

export default function PlanesListScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { canManagePlanes } = usePermissions();
  const canManage = canManagePlanes();

  const [planes, setPlanes] = useState<PlanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');

  const debouncedSearch = useDebounce(search, 400);

  const bgColor = useScreenBackground();
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
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
          <TextInput
            placeholder="Buscar por nombre, objetivo o asignación"
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={textSecondary} />
            </TouchableOpacity>
          ) : null}
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
                <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : textSecondary }]}>
                  {filterLabels[filter]}
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
        contentInsetAdjustmentBehavior="automatic"
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

      {canManage ? (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PlanForm', {})}
          accessibilityLabel="Crear plan"
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
