import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

export default function EmptyState({
  icon = 'inbox-outline',
  title,
  message,
}: EmptyStateProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const secondaryColor = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={secondaryColor} />
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: secondaryColor }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
