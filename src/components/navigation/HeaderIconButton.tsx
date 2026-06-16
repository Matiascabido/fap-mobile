import React, { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

/** Contenedor horizontal para iconos del header (sin altura fija: lo centra el stack nativo). */
export function HeaderActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

export const headerSideContainerStyle: ViewStyle = Platform.select({
  ios: {
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  android: {
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  default: {},
}) as ViewStyle;

export const headerLeftContainerStyle: ViewStyle = Platform.select({
  ios: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  android: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  default: {},
}) as ViewStyle;

interface HeaderIconButtonProps {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function HeaderIconButton({
  children,
  onPress,
  accessibilityLabel,
  disabled,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && { opacity: 0.55 },
        disabled && { opacity: 0.35 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.buttonInner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 44,
    height: 44,
  },
  buttonInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
