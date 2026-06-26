import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  MainTabParamList,
  SociosStackParamList,
  PlanesStackParamList,
  MoreStackParamList,
  HomeStackParamList,
  TutorialesStackParamList,
  TurneroStackParamList,
  MetricasStackParamList,
  SuscripcionesStackParamList,
  EvaluacionesStackParamList,
} from './types';
import { ROUTES } from '../constants/navigation';
import {
  TAB_MODULE_ICONS,
  TAB_MODULE_TITLES,
  isMainTabModuleRoute,
  type MainTabModuleRoute,
} from '../constants/navigationModules';
import { useAppTheme } from '../context/ThemeContext';
import { useNavigationPreferences } from '../context/NavigationPreferencesContext';
import type { AppThemeTokens } from '../theme/iosTheme';
import { palette } from '../constants/colors';

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
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/more/NotificationSettingsScreen';
import { StackHeaderRight } from '../components/navigation/StackHeaderRight';
import {
  headerLeftContainerStyle,
  headerSideContainerStyle,
} from '../components/navigation/HeaderIconButton';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TutorialesStack = createNativeStackNavigator<TutorialesStackParamList>();
const TurneroStack = createNativeStackNavigator<TurneroStackParamList>();
const MetricasStack = createNativeStackNavigator<MetricasStackParamList>();
const SuscripcionesStack = createNativeStackNavigator<SuscripcionesStackParamList>();
const EvaluacionesStack = createNativeStackNavigator<EvaluacionesStackParamList>();
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
    headerRightContainerStyle: headerSideContainerStyle,
    headerLeftContainerStyle: headerLeftContainerStyle,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerRight: () => <StackHeaderRight />,
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

function TurneroNavigator() {
  const { colors } = useAppTheme();
  return (
    <TurneroStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <TurneroStack.Screen
        name="TurneroMain"
        component={TurneroScreen}
        options={{ title: 'Turnero' }}
      />
    </TurneroStack.Navigator>
  );
}

function MetricasNavigator() {
  const { colors } = useAppTheme();
  return (
    <MetricasStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <MetricasStack.Screen
        name="MetricasMain"
        component={MetricasScreen}
        options={{ title: 'Métricas' }}
      />
    </MetricasStack.Navigator>
  );
}

function SuscripcionesNavigator() {
  const { colors } = useAppTheme();
  return (
    <SuscripcionesStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <SuscripcionesStack.Screen
        name="SuscripcionesMain"
        component={SuscripcionesScreen}
        options={{ title: 'Suscripciones' }}
      />
    </SuscripcionesStack.Navigator>
  );
}

function EvaluacionesNavigator() {
  const { colors } = useAppTheme();
  return (
    <EvaluacionesStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <EvaluacionesStack.Screen
        name="EvaluacionesMain"
        component={EvaluacionesScreen}
        options={{ title: 'Evaluaciones' }}
      />
    </EvaluacionesStack.Navigator>
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

const TAB_NAVIGATORS: Record<MainTabModuleRoute, React.ComponentType> = {
  Planes: PlanesNavigator,
  Tutoriales: TutorialesNavigator,
  Turnero: TurneroNavigator,
  Metricas: MetricasNavigator,
  Socios: SociosNavigator,
  Suscripciones: SuscripcionesNavigator,
  Evaluaciones: EvaluacionesNavigator,
};

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
      <MoreStack.Screen
        name={ROUTES.NOTIFICATIONS as 'Notifications'}
        component={NotificationsScreen}
        options={{ title: 'Notificaciones', headerRight: () => null }}
      />
      <MoreStack.Screen
        name={ROUTES.NOTIFICATION_SETTINGS as 'NotificationSettings'}
        component={NotificationSettingsScreen}
        options={{ title: 'Configuración', headerRight: () => null }}
      />
    </MoreStack.Navigator>
  );
}

function tabBarIcon(routeName: string, color: string, size: number) {
  if (routeName === ROUTES.HOME) {
    return <Ionicons name="home-outline" size={size} color={color} />;
  }
  if (routeName === 'More') {
    return <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />;
  }
  if (isMainTabModuleRoute(routeName)) {
    return <Ionicons name={TAB_MODULE_ICONS[routeName]} size={size} color={color} />;
  }
  return <Ionicons name="ellipse-outline" size={size} color={color} />;
}

export default function MainNavigator() {
  const { colors } = useAppTheme();
  const { tabRoutes, loading } = useNavigationPreferences();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.groupedBackground }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const dynamicTabs = tabRoutes.filter(isMainTabModuleRoute);

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
        tabBarIcon: ({ color, size }) => tabBarIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name={ROUTES.HOME as 'Home'} component={HomeNavigator} options={{ title: 'Inicio' }} />
      {dynamicTabs.map((route) => (
        <Tab.Screen
          key={route}
          name={route}
          component={TAB_NAVIGATORS[route]}
          options={{ title: TAB_MODULE_TITLES[route] }}
        />
      ))}
      <Tab.Screen
        name={'More' as 'More'}
        component={MoreNavigator}
        options={{ title: 'Más' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const state = navigation.getState();
            const moreRoute = state.routes.find((r) => r.name === 'More');
            const stackIndex = moreRoute?.state?.index ?? 0;

            if (stackIndex > 0 && moreRoute?.state?.key) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: moreRoute.state.key,
              });
            }

            navigation.navigate('More', { screen: 'MoreMenu' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
