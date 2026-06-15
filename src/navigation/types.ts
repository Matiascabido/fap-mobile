import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

// Main Drawer
export type MainDrawerParamList = {
  Home: undefined;
  Socios: NavigatorScreenParams<SociosStackParamList>;
  Planes: NavigatorScreenParams<PlanesStackParamList>;
  Suscripciones: undefined;
  Turnero: undefined;
  Evaluaciones: undefined;
  Metricas: undefined;
  Tutoriales: undefined;
  Perfil: undefined;
};

export type MainDrawerNavigationProp = DrawerNavigationProp<MainDrawerParamList>;

// Socios Stack
export type SociosStackParamList = {
  SociosList: undefined;
  SocioDetail: { socioId: string };
  SocioForm: undefined;
};

// Planes Stack
export type PlanesStackParamList = {
  PlanesList: undefined;
  PlanDetail: { planId: string };
  PlanForm: {
    planId?: string;
    initialNombre?: string;
    initialDescripcion?: string;
    initialSemanas?: number | null;
    initialObjetivo?: string;
    initialTipoPlanId?: string;
  };
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainDrawerParamList>;
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
