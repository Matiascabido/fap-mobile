import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { sociosService } from '../../services/api/socios.service';
import { Socio } from '../../types/socios.types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
import { useDebounce } from '../../hooks/useDebounce';
import { filterBySearch } from '../../utils/searchNormalize';
import { openWhatsApp } from '../../utils/whatsappLink';
import SocioListCard from '../../components/socios/SocioListCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activo' | 'inactivo';

export default function SociosListScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const { canManageSocios, canViewAllDni, hasPermission } = usePermissions();

  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');

  const debouncedSearch = useDebounce(search, 400);

  const canCreate = hasPermission('usuarios:create') || canManageSocios();
  const showDni = canViewAllDni();

  const loadSocios = useCallback(async () => {
    try {
      const data = await sociosService.getAll();
      setSocios(data);
    } catch (error) {
      console.error('Error loading socios:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSocios();
  }, [loadSocios]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSocios();
  }, [loadSocios]);

  const filteredSocios = useMemo(() => {
    let result = socios;

    if (debouncedSearch.trim()) {
      result = filterBySearch(result, debouncedSearch, (s) => [
        s.nombre,
        s.email,
        showDni ? s.dni : null,
        s.telefono,
        s.tipo,
        s.tipoEstatus,
        s.especialidad,
      ]);
    }

    if (estadoFilter !== 'todos') {
      result = result.filter((s) =>
        estadoFilter === 'activo' ? s.estado === 'Activo' : s.estado === 'Inactivo'
      );
    }

    return result;
  }, [socios, debouncedSearch, estadoFilter, showDni]);

  const handleWhatsApp = useCallback(async (socio: Socio) => {
    if (!socio.telefono) {
      Alert.alert('Sin teléfono', 'Este socio no tiene número de teléfono registrado.');
      return;
    }
    try {
      await openWhatsApp(socio.telefono);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    }
  }, []);

  const renderSocio = useCallback(
    ({ item }: { item: Socio }) => (
      <SocioListCard
        socio={item}
        showDni={showDni}
        onPress={() => navigation.navigate('SocioDetail', { socioId: item.id })}
        onWhatsApp={() => handleWhatsApp(item)}
      />
    ),
    [showDni, navigation, handleWhatsApp]
  );

  if (loading) {
    return <Loader fullscreen message="Cargando socios..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <View style={styles.header}>
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
            placeholder={`Buscar por nombre, email${showDni ? ', DNI' : ''}…`}
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

        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.tertiaryGroupedBackground },
          ]}
        >
          {(['todos', 'activo', 'inactivo'] as EstadoFilter[]).map((filter) => {
            const isActive = estadoFilter === filter;
            const labels: Record<EstadoFilter, string> = {
              todos: 'Todos',
              activo: 'Activos',
              inactivo: 'Inactivos',
            };
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.segment,
                  isActive && {
                    backgroundColor: colors.secondaryGroupedBackground,
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
                      color: isActive ? colors.label : colors.secondaryLabel,
                      fontWeight: isActive ? '600' : '500',
                    },
                  ]}
                >
                  {labels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.count, typography.footnote, { color: colors.secondaryLabel }]}>
          {filteredSocios.length} {filteredSocios.length === 1 ? 'socio' : 'socios'}
        </Text>
      </View>

      <FlatList
        data={filteredSocios}
        renderItem={renderSocio}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-search"
            title="Sin resultados"
            message="No se encontraron socios con los filtros aplicados"
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {canCreate ? (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SocioForm')}
          accessibilityLabel="Agregar socio"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 17, paddingVertical: 0 },
  segmented: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 9,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 7,
  },
  segmentText: { fontSize: 13 },
  count: { marginTop: 10, marginBottom: 4, marginLeft: 4 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
