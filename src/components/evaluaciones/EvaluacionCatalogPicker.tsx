import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EvaluacionGrupo } from '../../types/evaluaciones.types';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { writeLastGrupoId } from '../../utils/evaluaciones/registrosTimeline';

interface Props {
  catalogo: EvaluacionGrupo[];
  value: string;
  onChange: (grupoId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function EvaluacionCatalogPicker({
  catalogo,
  value,
  onChange,
  loading,
  disabled,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const sorted = [...catalogo].sort((a, b) => a.orden - b.orden);
  const selected = sorted.find((g) => g.id === value);
  const placeholder = loading ? 'Cargando…' : 'Seleccionar evaluación…';

  const handleSelect = (id: string) => {
    onChange(id);
    writeLastGrupoId(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: textSecondary }]}>Evaluación</Text>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: cardBg, borderColor }]}
        onPress={() => !disabled && !loading && setOpen(true)}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, { color: selected ? textPrimary : textSecondary }]}
          numberOfLines={1}
        >
          {selected?.nombre ?? placeholder}
        </Text>
        {loading ? (
          <MaterialCommunityIcons name="loading" size={20} color={textSecondary} />
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={22} color={textSecondary} />
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide">
        <View style={[styles.modal, { backgroundColor: bgColor, paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Evaluación</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <MaterialCommunityIcons name="close" size={26} color={textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: textSecondary }]}>
                No hay evaluaciones disponibles
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <TouchableOpacity
                  style={[styles.item, { borderBottomColor: borderColor }]}
                  onPress={() => handleSelect(item.id)}
                >
                  {isSelected ? (
                    <MaterialCommunityIcons name="check" size={20} color={palette.primary} />
                  ) : (
                    <View style={{ width: 20 }} />
                  )}
                  <Text style={[styles.itemText, { color: textPrimary }]}>{item.nombre}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  triggerText: { flex: 1, fontSize: 15, fontWeight: '600', marginRight: 8 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  list: { paddingHorizontal: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 16, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
});
