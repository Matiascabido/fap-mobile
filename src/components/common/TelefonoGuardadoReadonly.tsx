import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface Props {
  telefono: string;
  compact?: boolean;
}

export default function TelefonoGuardadoReadonly({ telefono, compact = false }: Props) {
  const { isDark } = useTheme();
  const value = telefono.trim();
  if (!value) return null;

  const bg = isDark ? palette.slate800 : palette.slate50;
  const borderColor = isDark ? palette.slate700 : palette.slate100;
  const textColor = isDark ? palette.darkTextPrimary : palette.slate700;
  const badgeBg = isDark ? palette.slate700 : palette.slate200;
  const badgeText = isDark ? palette.slate400 : palette.slate500;

  return (
    <View>
      <Text style={[styles.label, { color: palette.slate400 }]}>Teléfono</Text>
      <View
        style={[
          styles.row,
          compact ? styles.rowCompact : null,
          { backgroundColor: bg, borderColor },
        ]}
      >
        <Ionicons name="call-outline" size={14} color={palette.slate400} />
        <Text style={[styles.value, { color: textColor }]}>{value}</Text>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>Guardado</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowCompact: {
    paddingVertical: 8,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
