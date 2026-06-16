// Nombres de rutas
export const ROUTES = {
  // Auth
  AUTH: 'Auth',
  LOGIN: 'Login',
  
  // Main
  MAIN: 'Main',
  HOME: 'Home',
  SOCIOS: 'Socios',
  SOCIOS_LIST: 'SociosList',
  SOCIO_DETAIL: 'SocioDetail',
  PLANES: 'Planes',
  PLANES_LIST: 'PlanesList',
  PLAN_DETAIL: 'PlanDetail',
  SUSCRIPCIONES: 'Suscripciones',
  TURNERO: 'Turnero',
  EVALUACIONES: 'Evaluaciones',
  METRICAS: 'Metricas',
  TUTORIALES: 'Tutoriales',
  PERFIL: 'Perfil',
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
};

// Configuración de items del drawer con permisos
export interface DrawerItem {
  name: string;
  route: string;
  icon: string;
  scope?: string; // Scope necesario para ver este item
}

export const drawerItems: DrawerItem[] = [
  {
    name: 'Inicio',
    route: ROUTES.HOME,
    icon: 'home',
  },
  {
    name: 'Socios',
    route: ROUTES.SOCIOS,
    icon: 'account-group',
    scope: 'usuarios:view',
  },
  {
    name: 'Planes',
    route: ROUTES.PLANES,
    icon: 'dumbbell',
    scope: 'planes:view',
  },
  {
    name: 'Suscripciones',
    route: ROUTES.SUSCRIPCIONES,
    icon: 'card-account-details',
    scope: 'suscripciones:view',
  },
  {
    name: 'Turnero',
    route: ROUTES.TURNERO,
    icon: 'calendar-clock',
    scope: 'turnero:view',
  },
  {
    name: 'Evaluaciones',
    route: ROUTES.EVALUACIONES,
    icon: 'clipboard-text',
    scope: 'evaluaciones:view',
  },
  {
    name: 'Métricas',
    route: ROUTES.METRICAS,
    icon: 'chart-line',
    scope: 'metricas:view',
  },
  {
    name: 'Tutoriales',
    route: ROUTES.TUTORIALES,
    icon: 'video',
    scope: 'tutoriales:view',
  },
];
