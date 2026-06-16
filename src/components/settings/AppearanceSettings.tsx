import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { MAX_BACKGROUND_BYTES } from '../../utils/appearanceImage';
import type { BackgroundMode, DarkSurfacePreset } from '../../types/appearance.types';

interface AppearanceSettingsProps {
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

export default function AppearanceSettings({
  textPrimary,
  textSecondary,
  borderColor,
}: AppearanceSettingsProps) {
  const {
    theme,
    isDark,
    setTheme,
    appearance,
    setDarkSurfacePreset,
    setBackgroundMode,
    pickCustomBackground,
    clearCustomBackground,
    appearanceLoading,
  } = useAppTheme();

  const themeOptions = [
    { key: 'light' as const, label: 'Claro', icon: 'weather-sunny' as const },
    { key: 'dark' as const, label: 'Oscuro', icon: 'weather-night' as const },
    { key: 'auto' as const, label: 'Auto', icon: 'theme-light-dark' as const },
  ];

  const surfaceOptions: { key: DarkSurfacePreset; label: string; color: string }[] = [
    { key: 'matte_blue', label: 'Azul mate', color: '#1B2838' },
    { key: 'classic', label: 'Clásico', color: '#0F172A' },
  ];

  const bgModeOptions: { key: BackgroundMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'color', label: 'Color', icon: 'palette' },
    { key: 'image', label: 'Imagen', icon: 'image' },
  ];

  const handlePickImage = () => {
    void pickCustomBackground();
  };

  const handleClearImage = () => {
    Alert.alert('Quitar fondo', '¿Volvés al color del tema?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void clearCustomBackground() },
    ]);
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Apariencia</Text>
      <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
        Tema, color de fondo e imagen personalizada
      </Text>

      <Text style={[styles.groupLabel, { color: textSecondary }]}>Modo</Text>
      <View style={styles.row}>
        {themeOptions.map((option) => {
          const selected = theme === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.chip,
                {
                  borderColor: selected ? palette.primary : borderColor,
                  backgroundColor: selected ? palette.primary : 'transparent',
                },
              ]}
              onPress={() => void setTheme(option.key)}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={18}
                color={selected ? '#FFF' : textSecondary}
              />
              <Text style={[styles.chipText, { color: selected ? '#FFF' : textPrimary }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isDark ? (
        <>
          <Text style={[styles.groupLabel, { color: textSecondary }]}>Fondo oscuro</Text>
          <View style={styles.row}>
            {surfaceOptions.map((opt) => {
              const selected = appearance.darkSurfacePreset === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.surfaceChip,
                    { borderColor: selected ? palette.primary : borderColor },
                  ]}
                  onPress={() => void setDarkSurfacePreset(opt.key)}
                >
                  <View style={[styles.surfaceSwatch, { backgroundColor: opt.color }]} />
                  <Text style={[styles.chipText, { color: selected ? palette.primary : textPrimary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={[styles.groupLabel, { color: textSecondary }]}>Fondo de la app</Text>
      <View style={styles.row}>
        {bgModeOptions.map((opt) => {
          const selected = appearance.backgroundMode === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                {
                  borderColor: selected ? palette.primary : borderColor,
                  backgroundColor: selected ? `${palette.primary}15` : 'transparent',
                },
              ]}
              onPress={() => void setBackgroundMode(opt.key)}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={18}
                color={selected ? palette.primary : textSecondary}
              />
              <Text style={[styles.chipText, { color: selected ? palette.primary : textPrimary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {appearance.backgroundMode === 'image' ? (
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: palette.primary }]}
            onPress={handlePickImage}
            disabled={appearanceLoading}
          >
            {appearanceLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="upload" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>
                  {appearance.customBackgroundUri ? 'Cambiar imagen' : 'Elegir imagen'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {appearance.customBackgroundUri ? (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { borderColor }]}
              onPress={handleClearImage}
            >
              <Text style={[styles.actionBtnOutlineText, { color: textSecondary }]}>Quitar</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.hint, { color: textSecondary }]}>
            Se guarda en el dispositivo (máx. {Math.round(MAX_BACKGROUND_BYTES / (1024 * 1024))} MB).
            Las tarjetas quedan semitransparentes para leer bien el contenido.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  surfaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  surfaceSwatch: { width: 22, height: 22, borderRadius: 6 },
  imageActions: { marginTop: 12, gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  actionBtnOutline: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnOutlineText: { fontWeight: '600', fontSize: 14 },
  hint: { fontSize: 12, lineHeight: 17 },
});
