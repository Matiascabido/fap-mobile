import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import {
  colorPresetForBloqueTitulo,
  filterBloqueTitulosPreset,
  getBlockPickerColors,
} from '../../utils/planBloqueTitulos';

interface BloqueNombreFieldProps {
  nombre: string;
  color: string;
  onNombreChange: (nombre: string) => void;
  onColorChange: (color: string) => void;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function BloqueNombreField({
  nombre,
  color,
  onNombreChange,
  onColorChange,
  textPrimary,
  textSecondary,
  borderColor,
  disabled = false,
  placeholder = 'Ej: Movilidad',
}: BloqueNombreFieldProps) {
  const { isDark } = useTheme();
  const [presetOpen, setPresetOpen] = useState(false);
  const surfaceColor = isDark ? palette.darkCard : '#FFFFFF';
  const filteredPresets = useMemo(() => filterBloqueTitulosPreset(nombre), [nombre]);
  const pickerColors = useMemo(() => getBlockPickerColors(), []);

  const handleNombreChange = (text: string) => {
    onNombreChange(text);
    const presetColor = colorPresetForBloqueTitulo(text);
    if (presetColor) onColorChange(presetColor);
  };

  const pickPreset = (presetNombre: string, presetColor: string) => {
    onNombreChange(presetNombre);
    onColorChange(presetColor);
    setPresetOpen(false);
  };

  return (
    <View>
      <Text style={[styles.label, { color: textSecondary }]}>Nombre *</Text>
      <View style={styles.nombreRow}>
        <TextInput
          style={[styles.input, styles.nombreInput, { borderColor, color: textPrimary }]}
          value={nombre}
          onChangeText={handleNombreChange}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          editable={!disabled}
          onFocus={() => !disabled && setPresetOpen(true)}
        />
        <TouchableOpacity
          style={[styles.presetBtn, { borderColor }]}
          onPress={() => !disabled && setPresetOpen((v) => !v)}
          disabled={disabled}
          accessibilityLabel="Ver títulos sugeridos"
        >
          <Ionicons
            name={presetOpen ? 'chevron-up' : 'list-outline'}
            size={20}
            color={textSecondary}
          />
        </TouchableOpacity>
      </View>

      {presetOpen && !disabled ? (
        <View style={[styles.presetList, { borderColor, backgroundColor: surfaceColor }]}>
          <ScrollView
            style={styles.presetScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredPresets.length === 0 ? (
              <Text style={[styles.presetEmpty, { color: textSecondary }]}>
                Sin coincidencias — podés escribir un título nuevo.
              </Text>
            ) : (
              filteredPresets.map((opt) => {
                const selected =
                  nombre.trim().toLocaleLowerCase('es') === opt.nombre.toLocaleLowerCase('es');
                return (
                  <TouchableOpacity
                    key={opt.nombre}
                    style={[
                      styles.presetRow,
                      selected && { backgroundColor: `${palette.primary}12` },
                    ]}
                    onPress={() => pickPreset(opt.nombre, opt.color)}
                  >
                    <View style={[styles.presetDot, { backgroundColor: opt.color }]} />
                    <Text style={[styles.presetNombre, { color: textPrimary }]} numberOfLines={1}>
                      {opt.nombre}
                    </Text>
                    <Text style={[styles.presetHex, { color: textSecondary }]}>{opt.color}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}

      <Text style={[styles.label, { color: textSecondary }]}>Color</Text>
      <Text style={[styles.colorHint, { color: textSecondary }]}>
        Los títulos sugeridos traen color; también podés elegir otro abajo.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.colorsScroll}
        contentContainerStyle={styles.colorsRow}
      >
        {pickerColors.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color.toUpperCase() === c.toUpperCase() && styles.colorDotSel,
            ]}
            onPress={() => onColorChange(c)}
            disabled={disabled}
            accessibilityLabel={`Color ${c}`}
          />
        ))}
      </ScrollView>
      <Text style={[styles.colorValue, { color: textSecondary }]}>{color}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
  },
  nombreInput: {
    flex: 1,
  },
  presetBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  presetScroll: {
    maxHeight: 220,
  },
  presetEmpty: {
    fontSize: 13,
    padding: 14,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  presetDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  presetNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  presetHex: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  colorHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  colorsScroll: {
    marginBottom: 4,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorDotSel: {
    borderWidth: 3,
    borderColor: palette.slate900,
  },
  colorValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
});
