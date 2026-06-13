import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sociosService } from '../../services/api/socios.service';
import { Socio } from '../../types/socios.types';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { useDebounce } from '../../hooks/useDebounce';
import Avatar from './Avatar';
import Loader from './Loader';

interface SocioSelectorProps {
  selected: Socio | null;
  onSelect: (socio: Socio) => void;
  placeholder?: string;
}

export default function SocioSelector({
  selected,
  onSelect,
  placeholder = 'Seleccionar socio',
}: SocioSelectorProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [visible, setVisible] = useState(false);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  useEffect(() => {
    if (visible && socios.length === 0) {
      setLoading(true);
      sociosService
        .getSocios()
        .then(setSocios)
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return socios;
    const term = debouncedSearch.toLowerCase().trim();
    return socios.filter(
      (s) => s.nombre.toLowerCase().includes(term) || s.dni.includes(term)
    );
  }, [socios, debouncedSearch]);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: cardBg, borderColor }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        {selected ? (
          <View style={styles.selectedRow}>
            <Avatar nombre={selected.nombre.split(' ')[0]} apellido={selected.nombre.split(' ')[1]} size={36} />
            <Text style={[styles.selectedText, { color: textPrimary }]} numberOfLines={1}>
              {selected.nombre}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: textSecondary }]}>{placeholder}</Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={22} color={textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor, paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Seleccionar socio</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <MaterialCommunityIcons name="close" size={26} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={textSecondary} />
              <TextInput
                placeholder="Buscar por nombre o DNI"
                placeholderTextColor={textSecondary}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: textPrimary }]}
                autoCapitalize="none"
              />
            </View>
          </View>

          {loading ? (
            <Loader message="Cargando socios..." />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.socioItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Avatar
                    nombre={item.nombre.split(' ')[0]}
                    apellido={item.nombre.split(' ')[1]}
                    size={40}
                  />
                  <View style={styles.socioItemInfo}>
                    <Text style={[styles.socioItemName, { color: textPrimary }]}>
                      {item.nombre}
                    </Text>
                    <Text style={[styles.socioItemDni, { color: textSecondary }]}>
                      DNI: {item.dni}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  placeholder: {
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
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
  listContent: {
    paddingHorizontal: 16,
  },
  socioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  socioItemInfo: {
    flex: 1,
  },
  socioItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  socioItemDni: {
    fontSize: 13,
    marginTop: 2,
  },
});
