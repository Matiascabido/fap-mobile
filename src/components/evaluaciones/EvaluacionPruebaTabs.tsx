import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { PruebaEstadoSesion } from '../../types/evaluaciones.types';
import type { PruebaConSeccion } from '../../utils/evaluaciones/pruebaOrdering';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface Props {
  pruebas: PruebaConSeccion[];
  activeId: string;
  estados: Record<string, PruebaEstadoSesion | 'guardada' | 'omitida' | 'pendiente' | 'activa'>;
  onSelect: (pruebaId: string) => void;
}

function estadoIcon(estado: string): string {
  if (estado === 'guardada') return '✓';
  if (estado === 'omitida') return '—';
  return '○';
}

export default function EvaluacionPruebaTabs({ pruebas, activeId, estados, onSelect }: Props) {
  const { isDark } = useTheme();
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {pruebas.map((p) => {
        const estado = estados[p.id] ?? 'pendiente';
        const isActive = p.id === activeId;
        const isDone = estado === 'guardada';
        const isOmit = estado === 'omitida';

        return (
          <TouchableOpacity
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[
              styles.chip,
              {
                borderColor: isActive ? palette.primary : borderColor,
                backgroundColor: isDone
                  ? `${palette.success}18`
                  : isOmit
                  ? isDark
                    ? palette.darkCard
                    : '#F1F5F9'
                  : isActive
                  ? `${palette.primary}12`
                  : isDark
                  ? palette.darkCard
                  : '#FFFFFF',
              },
            ]}
          >
            <Text style={[styles.chipText, { color: textPrimary }]} numberOfLines={2}>
              {estadoIcon(estado)} {p.nombre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  chip: {
    maxWidth: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
});
