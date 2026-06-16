import { Ionicons } from '@expo/vector-icons';

export const MAIN_TAB_MODULE_ROUTES = [
  'Planes',
  'Tutoriales',
  'Turnero',
  'Metricas',
  'Socios',
  'Suscripciones',
  'Evaluaciones',
] as const;

export type MainTabModuleRoute = (typeof MAIN_TAB_MODULE_ROUTES)[number];

export const TAB_MODULE_ICONS: Record<
  MainTabModuleRoute,
  keyof typeof Ionicons.glyphMap
> = {
  Planes: 'barbell-outline',
  Tutoriales: 'play-circle-outline',
  Turnero: 'calendar-outline',
  Metricas: 'stats-chart-outline',
  Socios: 'people-outline',
  Suscripciones: 'card-outline',
  Evaluaciones: 'clipboard-outline',
};

export const TAB_MODULE_TITLES: Record<MainTabModuleRoute, string> = {
  Planes: 'Planes',
  Tutoriales: 'Tutoriales',
  Turnero: 'Turnero',
  Metricas: 'Métricas',
  Socios: 'Socios',
  Suscripciones: 'Suscripciones',
  Evaluaciones: 'Evaluaciones',
};

export const TAB_MODULE_INITIAL_SCREEN: Record<MainTabModuleRoute, string> = {
  Planes: 'PlanesList',
  Tutoriales: 'TutorialesMain',
  Turnero: 'TurneroMain',
  Metricas: 'MetricasMain',
  Socios: 'SociosList',
  Suscripciones: 'SuscripcionesMain',
  Evaluaciones: 'EvaluacionesMain',
};

export function isMainTabModuleRoute(route: string): route is MainTabModuleRoute {
  return (MAIN_TAB_MODULE_ROUTES as readonly string[]).includes(route);
}
