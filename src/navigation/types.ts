import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

// Home stack
export type HomeStackParamList = {
  HomeMain: undefined;
};

// Tutoriales stack
export type TutorialesStackParamList = {
  TutorialesMain: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Planes: NavigatorScreenParams<PlanesStackParamList> | undefined;
  Tutoriales: NavigatorScreenParams<TutorialesStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type MainDrawerParamList = MainTabParamList;

// More stack (secondary modules)
export type MoreStackParamList = {
  MoreMenu: undefined;
  Socios: NavigatorScreenParams<SociosStackParamList> | undefined;
  Suscripciones: undefined;
  Turnero: undefined;
  Evaluaciones: undefined;
  Metricas: undefined;
  Perfil: undefined;
};

// Socios Stack
export type SociosStackParamList = {
  SociosList: undefined;
  SocioDetail: { socioId: string };
  SocioForm: undefined;
};

export type SociosNavigationProp = NativeStackNavigationProp<SociosStackParamList>;

// Planes Stack
export type PlanesStackParamList = {
  PlanesList: undefined;
  PlanDetail: { planId: string };
  PlanEjercicioDetail: {
    planId: string;
    planBloqueId?: string;
    bloqueNombre?: string;
    ejercicio: import('../types/planes.types').PlanEjercicioItem;
  };
  PlanForm: {
    planId?: string;
    initialNombre?: string;
    initialDescripcion?: string;
    initialSemanas?: number | null;
    initialObjetivo?: string;
    initialTipoPlanId?: string;
  };
};

export type PlanesNavigationProp = NativeStackNavigationProp<PlanesStackParamList>;

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
