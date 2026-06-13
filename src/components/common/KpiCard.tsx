import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent?: string;
  subtitle?: string;
}

function KpiCard({ label, value, icon, accent = palette.primary, subtitle }: KpiCardProps) {
  const { isDark } = useTheme();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${accent}20` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={accent} />
      </View>
      <Text style={[styles.value, { color: textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default React.memo(KpiCard);
