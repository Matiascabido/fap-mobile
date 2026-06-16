import React, { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'grouped';
}

export default function Card({ children, onPress, style, padding = 16, variant = 'default' }: CardProps) {
  const { colors } = useAppTheme();
  const isGrouped = variant === 'grouped';

  const cardStyle = [
    isGrouped ? styles.cardGrouped : styles.card,
    {
      backgroundColor: colors.secondaryGroupedBackground,
      borderColor: colors.separator,
      padding,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGrouped: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
