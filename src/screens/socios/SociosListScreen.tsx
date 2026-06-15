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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sociosService } from '../../services/api/socios.service';
import { Socio } from '../../types/socios.types';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import { filterBySearch } from '../../utils/searchNormalize';
import { openWhatsApp } from '../../utils/whatsappLink';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activo' | 'inactivo';

export default function SociosListScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { canManageSocios, canViewAllDni, hasPermission } = usePermissions();

  const [socios, setSocios] = useState<Socio[]>([]);
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
    ({ item }: { item: Socio }) => {
      const parts = item.nombre.split(' ');
      const nombre = parts[0] ?? '';
      const apellido = parts.slice(1).join(' ');

      return (
        <TouchableOpacity
          style={[styles.socioCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => navigation.navigate('SocioDetail', { socioId: item.id })}
          activeOpacity={0.7}
        >
          <Avatar nombre={nombre} apellido={apellido} size={48} />
          <View style={styles.socioInfo}>
            <Text style={[styles.socioNombre, { color: textPrimary }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={[styles.socioEmail, { color: textSecondary }]} numberOfLines={1}>
              {item.email || 'Sin email'}
            </Text>
            {showDni && item.dni ? (
              <Text style={[styles.socioDni, { color: textSecondary }]}>DNI: {item.dni}</Text>
            ) : null}
            {item.telefono ? (
              <View style={styles.phoneRow}>
                <MaterialCommunityIcons name="phone" size={12} color={textSecondary} />
                <Text style={[styles.socioTelefono, { color: textSecondary }]}>{item.telefono}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.socioRight}>
            <Badge
              label={item.estado}
              variant={item.estado === 'Activo' ? 'success' : 'neutral'}
            />
            <View style={styles.actionButtons}>
              {item.telefono && (
                <TouchableOpacity
                  style={styles.waButton}
                  onPress={() => handleWhatsApp(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons name="chevron-right" size={20} color={textSecondary} />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [cardBg, borderColor, textPrimary, textSecondary, navigation, handleWhatsApp, showDni]
  );

  if (loading) {
    return <Loader fullscreen message="Cargando socios..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Barra de búsqueda */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
          <TextInput
            placeholder={`Buscar por nombre, email${showDni ? ', DNI' : ''}`}
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

        {/* Filtros de estado */}
        <View style={styles.filters}>
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
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? palette.primary : cardBg,
                    borderColor: isActive ? palette.primary : borderColor,
                  },
                ]}
                onPress={() => setEstadoFilter(filter)}
              >
                <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : textSecondary }]}>
                  {labels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.count, { color: textSecondary }]}>
          {filteredSocios.length} {filteredSocios.length === 1 ? 'socio' : 'socios'}
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredSocios}
        renderItem={renderSocio}
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
            icon="account-search"
            title="Sin resultados"
            message="No se encontraron socios con los filtros aplicados"
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={12}
      />

      {/* FAB Agregar */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SocioForm')}
          accessibilityLabel="Agregar socio"
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  filters: { flexDirection: 'row', marginTop: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 13, marginTop: 12, marginBottom: 4 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  socioCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  socioInfo: { flex: 1, marginLeft: 12 },
  socioNombre: { fontSize: 16, fontWeight: '600' },
  socioEmail: { fontSize: 13, marginTop: 2 },
  socioDni: { fontSize: 12, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  socioTelefono: { fontSize: 12 },
  socioRight: { alignItems: 'flex-end', gap: 6 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waButton: { padding: 4 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});
