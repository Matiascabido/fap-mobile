import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const variantStyle = getVariantStyle(variant);

  return (
    <View style={[styles.badge, { backgroundColor: variantStyle.bg }]}>
      <Text style={[styles.text, { color: variantStyle.text }]}>{label}</Text>
    </View>
  );
}

function getVariantStyle(variant: BadgeVariant) {
  switch (variant) {
    case 'success':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: palette.success };
    case 'warning':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: palette.warning };
    case 'error':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: palette.error };
    case 'info':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: palette.info };
    default:
      return { bg: 'rgba(100, 116, 139, 0.15)', text: palette.slate500 };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default React.memo(Badge);
