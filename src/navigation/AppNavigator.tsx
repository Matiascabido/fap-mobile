import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { palette } from '../constants/colors';
import { setNavigationCallback } from '../services/api/http';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import FloatingActionButtons from '../components/common/FloatingActionButtons';
import { getActiveRouteName } from './routeUtils';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [activeRoute, setActiveRoute] = useState<string | undefined>();

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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? palette.darkBg : palette.lightBg },
        ]}
      >
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={syncActiveRoute}
      onStateChange={syncActiveRoute}
    >
      {isAuthenticated ? (
        <>
          <MainNavigator />
          <FloatingActionButtons activeRoute={activeRoute} />
        </>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
