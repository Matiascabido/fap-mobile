import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { evolucionCeldaColors } from '../../utils/evaluaciones/evolucionPrueba';

interface Props {
  texto: string;
  colorKey: string;
  compact?: boolean;
}

export default function EvaluacionValorPill({ texto, colorKey, compact }: Props) {
  const { isDark } = useTheme();
  const colors = evolucionCeldaColors(colorKey, isDark);

  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <Text
        style={[compact ? styles.textCompact : styles.text, { color: colors.color }]}
        numberOfLines={compact ? 2 : 4}
      >
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
});
