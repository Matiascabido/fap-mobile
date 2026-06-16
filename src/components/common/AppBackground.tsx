import React, { ReactNode } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface AppBackgroundProps {
  children: ReactNode;
}

/**
 * Capa de fondo global: color mate o imagen personalizada con scrim para legibilidad.
 */
export default function AppBackground({ children }: AppBackgroundProps) {
  const { colors, isDark } = useAppTheme();

  if (colors.hasBackgroundImage && colors.customBackgroundUri) {
    return (
      <ImageBackground
        source={{ uri: colors.customBackgroundUri }}
        style={styles.root}
        resizeMode="cover"
      >
        <View
          style={[
            styles.scrim,
            { backgroundColor: isDark ? 'rgba(21, 36, 51, 0.72)' : 'rgba(242, 242, 247, 0.78)' },
          ]}
        />
        <View style={styles.content}>{children}</View>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.canvasBackground }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1 },
});
