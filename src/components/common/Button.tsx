import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';
import { hapticLight } from '../../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'filled' | 'gray' | 'plain';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant, isDisabled);

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={variantStyles.text.color}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, variantStyles.text]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: ButtonVariant, disabled: boolean) {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: palette.primary },
        text: { color: '#FFFFFF' },
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.25)',
        },
        text: { color: '#FFFFFF' },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: palette.primary,
        },
        text: { color: palette.primary },
      };
    case 'danger':
      return {
        container: { backgroundColor: palette.error },
        text: { color: '#FFFFFF' },
      };
    case 'filled':
      return {
        container: { backgroundColor: palette.primary, borderRadius: 10 },
        text: { color: '#FFFFFF' },
      };
    case 'gray':
      return {
        container: { backgroundColor: '#78788033', borderRadius: 10 },
        text: { color: palette.lightTextPrimary },
      };
    case 'plain':
      return {
        container: { backgroundColor: 'transparent', borderRadius: 10 },
        text: { color: palette.primary },
      };
    default:
      return {
        container: { backgroundColor: palette.primary },
        text: { color: '#FFFFFF' },
      };
  }
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
