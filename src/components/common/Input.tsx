import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isPassword?: boolean;
  /** Fuerza estilos claros (p. ej. login sobre card blanca con tema oscuro activo). */
  surface?: 'default' | 'light';
}

export default function Input({
  label,
  error,
  icon,
  isPassword = false,
  surface = 'default',
  value,
  onChangeText,
  ...rest
}: InputProps) {
  const { isDark } = useTheme();
  const useLightSurface = surface === 'light' || !isDark;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const textColor = useLightSurface ? palette.lightTextPrimary : palette.darkTextPrimary;
  const placeholderColor = useLightSurface ? palette.lightTextSecondary : palette.darkTextSecondary;
  const bgColor = useLightSurface ? palette.slate50 : palette.darkBg;

  const borderColor = error
    ? palette.error
    : isFocused
    ? palette.primary
    : useLightSurface
    ? palette.lightBorder
    : palette.darkBorder;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: bgColor,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={placeholderColor}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={placeholderColor}
          style={[styles.input, { color: textColor }]}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.rightIcon}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  error: {
    color: palette.error,
    fontSize: 13,
    marginTop: 4,
  },
});
