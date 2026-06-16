import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  MainTabParamList,
  SociosStackParamList,
  PlanesStackParamList,
  MoreStackParamList,
  HomeStackParamList,
  TutorialesStackParamList,
} from './types';
import { ROUTES } from '../constants/navigation';
import { useAppTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import type { AppThemeTokens } from '../theme/iosTheme';

import HomeScreen from '../screens/home/HomeScreen';
import SociosListScreen from '../screens/socios/SociosListScreen';
import SocioDetailScreen from '../screens/socios/SocioDetailScreen';
import SocioFormScreen from '../screens/socios/SocioFormScreen';
import PlanesListScreen from '../screens/planes/PlanesListScreen';
import PlanDetailScreen from '../screens/planes/PlanDetailScreen';
import PlanEjercicioDetailScreen from '../screens/planes/PlanEjercicioDetailScreen';
import PlanFormScreen from '../screens/planes/PlanFormScreen';
import SuscripcionesScreen from '../screens/suscripciones/SuscripcionesScreen';
import TurneroScreen from '../screens/turnero/TurneroScreen';
import EvaluacionesScreen from '../screens/evaluaciones/EvaluacionesScreen';
import MetricasScreen from '../screens/metricas/MetricasScreen';
import TutorialesScreen from '../screens/tutoriales/TutorialesScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';
import MoreScreen from '../screens/more/MoreScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TutorialesStack = createNativeStackNavigator<TutorialesStackParamList>();
const SociosStack = createNativeStackNavigator<SociosStackParamList>();
const PlanesStack = createNativeStackNavigator<PlanesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function stackScreenOptions(colors: AppThemeTokens) {
  const screenBg = colors.hasBackgroundImage ? 'transparent' : colors.groupedBackground;
  return {
    headerStyle: { backgroundColor: colors.secondaryGroupedBackground },
    headerTintColor: colors.tint,
    headerTitleStyle: { fontWeight: '600' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: screenBg },
    ...(Platform.OS === 'ios' ? { headerBlurEffect: 'regular' as const } : {}),
  };
}

function HomeNavigator() {
  const { colors } = useAppTheme();
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
    </HomeStack.Navigator>
  );
}

function TutorialesNavigator() {
  const { colors } = useAppTheme();
  return (
    <TutorialesStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <TutorialesStack.Screen
        name="TutorialesMain"
        component={TutorialesScreen}
        options={{ title: 'Tutoriales' }}
      />
    </TutorialesStack.Navigator>
  );
}

function SociosNavigator() {
  const { colors } = useAppTheme();
  return (
    <SociosStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <SociosStack.Screen
        name="SociosList"
        component={SociosListScreen}
        options={{ title: 'Socios' }}
      />
      <SociosStack.Screen name="SocioDetail" component={SocioDetailScreen} options={{ title: 'Socio' }} />
      <SociosStack.Screen name="SocioForm" component={SocioFormScreen} options={{ title: 'Nuevo socio' }} />
    </SociosStack.Navigator>
  );
}

function PlanesNavigator() {
  const { colors } = useAppTheme();
  return (
    <PlanesStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <PlanesStack.Screen
        name="PlanesList"
        component={PlanesListScreen}
        options={{ title: 'Planes' }}
      />
      <PlanesStack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: 'Plan' }} />
      <PlanesStack.Screen
        name="PlanEjercicioDetail"
        component={PlanEjercicioDetailScreen}
        options={{ title: 'Ejercicio' }}
      />
      <PlanesStack.Screen name="PlanForm" component={PlanFormScreen} options={{ title: 'Plan' }} />
    </PlanesStack.Navigator>
  );
}

function MoreNavigator() {
  const { colors } = useAppTheme();
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <MoreStack.Screen
        name="MoreMenu"
        component={MoreScreen}
        options={{ title: 'Más' }}
      />
      <MoreStack.Screen
        name={ROUTES.SOCIOS as 'Socios'}
        component={SociosNavigator}
        options={{ headerShown: false }}
      />
      <MoreStack.Screen
        name={ROUTES.SUSCRIPCIONES as 'Suscripciones'}
        component={SuscripcionesScreen}
        options={{ title: 'Suscripciones' }}
      />
      <MoreStack.Screen name={ROUTES.TURNERO as 'Turnero'} component={TurneroScreen} options={{ title: 'Turnero' }} />
      <MoreStack.Screen
        name={ROUTES.EVALUACIONES as 'Evaluaciones'}
        component={EvaluacionesScreen}
        options={{ title: 'Evaluaciones' }}
      />
      <MoreStack.Screen name={ROUTES.METRICAS as 'Metricas'} component={MetricasScreen} options={{ title: 'Métricas' }} />
      <MoreStack.Screen name={ROUTES.PERFIL as 'Perfil'} component={PerfilScreen} options={{ title: 'Mi perfil' }} />
    </MoreStack.Navigator>
  );
}

export default function MainNavigator() {
  const { colors } = useAppTheme();
  const { hasPermission } = usePermissions();

  const showPlanes = hasPermission('planes:view');
  const showTutoriales = hasPermission('tutoriales:view');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: colors.secondaryGroupedBackground,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            [ROUTES.HOME]: 'home-outline',
            [ROUTES.PLANES]: 'barbell-outline',
            [ROUTES.TUTORIALES]: 'play-circle-outline',
            More: 'ellipsis-horizontal-circle-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={ROUTES.HOME as 'Home'} component={HomeNavigator} options={{ title: 'Inicio' }} />
      {showPlanes ? (
        <Tab.Screen name={ROUTES.PLANES as 'Planes'} component={PlanesNavigator} options={{ title: 'Planes' }} />
      ) : null}
      {showTutoriales ? (
        <Tab.Screen
          name={ROUTES.TUTORIALES as 'Tutoriales'}
          component={TutorialesNavigator}
          options={{ title: 'Tutoriales' }}
        />
      ) : null}
      <Tab.Screen
        name={'More' as 'More'}
        component={MoreNavigator}
        options={{ title: 'Más' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('More', { screen: 'MoreMenu' });
          },
        })}
      />
    </Tab.Navigator>
  );
}
