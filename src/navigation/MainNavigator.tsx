import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MainDrawerParamList,
  SociosStackParamList,
  PlanesStackParamList,
} from './types';
import { ROUTES } from '../constants/navigation';
import { palette } from '../constants/colors';
import DrawerContent from '../components/navigation/DrawerContent';
import Header from '../components/navigation/Header';
import FloatingActionButtons from '../components/common/FloatingActionButtons';

import HomeScreen from '../screens/home/HomeScreen';
import SociosListScreen from '../screens/socios/SociosListScreen';
import SocioDetailScreen from '../screens/socios/SocioDetailScreen';
import PlanesListScreen from '../screens/planes/PlanesListScreen';
import PlanDetailScreen from '../screens/planes/PlanDetailScreen';
import SuscripcionesScreen from '../screens/suscripciones/SuscripcionesScreen';
import TurneroScreen from '../screens/turnero/TurneroScreen';
import EvaluacionesScreen from '../screens/evaluaciones/EvaluacionesScreen';
import MetricasScreen from '../screens/metricas/MetricasScreen';
import TutorialesScreen from '../screens/tutoriales/TutorialesScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';

const Drawer = createDrawerNavigator<MainDrawerParamList>();
const SociosStack = createStackNavigator<SociosStackParamList>();
const PlanesStack = createStackNavigator<PlanesStackParamList>();

// Stack de Socios (lista + detalle)
function SociosNavigator() {
  return (
    <SociosStack.Navigator screenOptions={{ headerShown: false }}>
      <SociosStack.Screen name="SociosList" component={SociosListScreen} />
      <SociosStack.Screen name="SocioDetail" component={SocioDetailScreen} />
    </SociosStack.Navigator>
  );
}

// Stack de Planes (lista + detalle)
function PlanesNavigator() {
  return (
    <PlanesStack.Navigator screenOptions={{ headerShown: false }}>
      <PlanesStack.Screen name="PlanesList" component={PlanesListScreen} />
      <PlanesStack.Screen name="PlanDetail" component={PlanDetailScreen} />
    </PlanesStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <View style={styles.root}>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} title={getTitleForRoute(route.name)} />,
          drawerType: 'front',
          drawerStyle: {
            width: 288,
            backgroundColor: palette.slate800,
          },
          sceneContainerStyle: {
            backgroundColor: palette.slate50,
          },
        })}
      >
        <Drawer.Screen name={ROUTES.HOME as keyof MainDrawerParamList} component={HomeScreen} />
        <Drawer.Screen name={ROUTES.SOCIOS as keyof MainDrawerParamList} component={SociosNavigator} />
        <Drawer.Screen name={ROUTES.PLANES as keyof MainDrawerParamList} component={PlanesNavigator} />
        <Drawer.Screen
          name={ROUTES.SUSCRIPCIONES as keyof MainDrawerParamList}
          component={SuscripcionesScreen}
        />
        <Drawer.Screen name={ROUTES.TURNERO as keyof MainDrawerParamList} component={TurneroScreen} />
        <Drawer.Screen
          name={ROUTES.EVALUACIONES as keyof MainDrawerParamList}
          component={EvaluacionesScreen}
        />
        <Drawer.Screen name={ROUTES.METRICAS as keyof MainDrawerParamList} component={MetricasScreen} />
        <Drawer.Screen
          name={ROUTES.TUTORIALES as keyof MainDrawerParamList}
          component={TutorialesScreen}
        />
        <Drawer.Screen name={ROUTES.PERFIL as keyof MainDrawerParamList} component={PerfilScreen} />
      </Drawer.Navigator>
      <FloatingActionButtons />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

function getTitleForRoute(routeName: string): string {
  const titles: Record<string, string> = {
    Home: 'Inicio',
    Socios: 'Socios',
    Planes: 'Planes',
    Suscripciones: 'Suscripciones',
    Turnero: 'Turnero',
    Evaluaciones: 'Evaluaciones',
    Metricas: 'Métricas',
    Tutoriales: 'Tutoriales',
    Perfil: 'Perfil',
  };
  return titles[routeName] || 'FAP';
}
