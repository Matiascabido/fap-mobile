import 'react-native-gesture-handler';
import 'react-native-reanimated';
import './src/styles/global.css';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { LocalProfileProvider } from './src/context/LocalProfileContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NavigationPreferencesProvider } from './src/context/NavigationPreferencesContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { VideoFeedProvider } from './src/context/VideoFeedContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <LocalProfileProvider>
                <NavigationPreferencesProvider>
                  <NotificationsProvider>
                    <VideoFeedProvider>
                      <StatusBar style="auto" />
                      <AppNavigator />
                    </VideoFeedProvider>
                  </NotificationsProvider>
                </NavigationPreferencesProvider>
              </LocalProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
