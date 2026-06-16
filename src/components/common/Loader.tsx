import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { palette } from '../../constants/colors';

interface LoaderProps {
  size?: 'small' | 'large';
  fullscreen?: boolean;
  message?: string;
}

export default function Loader({
  size = 'large',
  fullscreen = false,
  message,
}: LoaderProps) {
  const { colors } = useAppTheme();
  const screenBg = useScreenBackground();
  const textColor = colors.secondaryLabel;

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: screenBg }]}>
        <ActivityIndicator size={size} color={palette.primary} />
        {message && <Text style={[styles.message, { color: textColor }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={palette.primary} />
      {message && <Text style={[styles.message, { color: textColor }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
});
