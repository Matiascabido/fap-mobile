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
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import { filterBySearch } from '../../utils/searchNormalize';
import { openWhatsApp } from '../../utils/whatsappLink';
import SocioListCard from '../../components/socios/SocioListCard';
import InvitarProfesionalModal from '../../components/socios/InvitarProfesionalModal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

type EstadoFilter = 'todos' | 'activo' | 'inactivo';

export default function SociosListScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { canManageSocios, canViewAllDni, hasPermission, isAdminUser } = usePermissions();

  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [showInvitarProf, setShowInvitarProf] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const canCreate = hasPermission('usuarios:create') || canManageSocios();
  const showDni = canViewAllDni();

  const bgColor = useScreenBackground();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

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

  const filterLabels: Record<EstadoFilter, string> = {
    todos: 'Todos',
    activo: 'Activos',
    inactivo: 'Inactivos',
  };

  if (loading) {
    return <Loader fullscreen message="Cargando socios..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
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
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filters}>
          {(['todos', 'activo', 'inactivo'] as EstadoFilter[]).map((filter) => {
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

        {(canCreate || isAdminUser) && (
          <View style={styles.actionRow}>
            {isAdminUser ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowInvitarProf(true)}
              >
                <MaterialCommunityIcons name="account-plus-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Agregar profesional</Text>
              </TouchableOpacity>
            ) : null}
            {canCreate ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('SocioForm')}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Nuevo socio</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <FlatList
        data={filteredSocios}
        renderItem={renderSocio}
        keyExtractor={(item) => item.id}
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
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SocioForm')}
          accessibilityLabel="Agregar socio"
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      <InvitarProfesionalModal visible={showInvitarProf} onClose={() => setShowInvitarProf(false)} />
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
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: palette.primary,
  },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
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
