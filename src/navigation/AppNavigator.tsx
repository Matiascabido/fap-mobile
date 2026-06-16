import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { palette } from '../constants/colors';
import { setNavigationCallback } from '../services/api/http';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import FloatingActionButtons from '../components/common/FloatingActionButtons';
import AppBackground from '../components/common/AppBackground';
import { getActiveRouteName } from './routeUtils';
import { useVideoFeed } from '../context/VideoFeedContext';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [activeRoute, setActiveRoute] = useState<string | undefined>();
  const { isVideoFeedOpen } = useVideoFeed();

  const syncActiveRoute = useCallback(() => {
    const state = navigationRef.current?.getRootState();
    setActiveRoute(getActiveRouteName(state));
  }, []);

  // Configurar callback de navegación para el interceptor 401
  useEffect(() => {
    setNavigationCallback((route: string) => {
      if (navigationRef.current) {
        navigationRef.current.resetRoot({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    });
  }, []);

  if (isLoading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </AppBackground>
    );
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.hasBackgroundImage ? 'transparent' : colors.groupedBackground,
      card: colors.secondaryGroupedBackground,
      border: colors.separator,
      primary: colors.tint,
      text: colors.label,
    },
  };

  return (
    <AppBackground>
      <NavigationContainer ref={navigationRef} theme={navTheme} onReady={syncActiveRoute} onStateChange={syncActiveRoute}>
        {isAuthenticated ? (
          <>
            <MainNavigator />
            <FloatingActionButtons activeRoute={activeRoute} hide={isVideoFeedOpen} />
          </>
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
