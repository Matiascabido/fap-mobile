import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { QuickAccess } from '../../utils/quickAccesses';

interface QuickAccessGridProps {
  items: QuickAccess[];
  onPress: (route: string) => void;
}

export default function QuickAccessGrid({ items, onPress }: QuickAccessGridProps) {
  const { isDark, colors } = useAppTheme();
  const cardBg = isDark ? palette.slate800 : palette.slate50;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  if (items.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
        No hay accesos disponibles para tu rol.
      </Text>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => onPress(item.route)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${item.accent ?? palette.primary}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={26}
              color={item.accent ?? palette.primary}
            />
          </View>
          <Text style={[styles.title, { color: textPrimary }]}>{item.title}</Text>
          <Text style={[styles.description, { color: textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    minHeight: 130,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
