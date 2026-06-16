import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../constants/colors';

export interface QuickAccess {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  accent?: string;
}

interface BuildAccessesParams {
  isSocioSolo: boolean;
  isProfesional: boolean;
  isAdmin: boolean;
  canManageTurnos: boolean;
  canEnrollTurnos: boolean;
  canManageEvaluaciones: boolean;
  canViewPlanEntrenamiento: boolean;
  hasPermission: (codigo: string) => boolean;
}

export function buildQuickAccesses(p: BuildAccessesParams): QuickAccess[] {
  if (p.isSocioSolo) {
    return [
      {
        title: 'Tutoriales',
        description: 'Videos de ejercicios y técnicas',
        icon: 'video',
        route: 'Tutoriales',
        accent: palette.info,
      },
      {
        title: 'Métricas',
        description: 'Visualizá tu actividad',
        icon: 'chart-line',
        route: 'Metricas',
      },
    ];
  }

  const accesses: QuickAccess[] = [];

  accesses.push({
    title: 'Métricas',
    description: 'Dashboard según tu rol',
    icon: 'chart-line',
    route: 'Metricas',
  });

  if (p.canManageTurnos || p.canEnrollTurnos || p.hasPermission('turnero:view')) {
    accesses.push({
      title: 'Turnero',
      description: p.canManageTurnos ? 'Gestioná clases y turnos' : 'Inscribite a tus clases',
      icon: 'calendar-clock',
      route: 'Turnero',
      accent: palette.success,
    });
  }

  if (p.canViewPlanEntrenamiento || p.hasPermission('planes:view')) {
    accesses.push({
      title: 'Planes',
      description: p.isProfesional || p.isAdmin ? 'Creá y gestioná planes' : 'Tu plan de entrenamiento',
      icon: 'dumbbell',
      route: 'Planes',
      accent: palette.warning,
    });
  }

  if (p.hasPermission('tutoriales:view')) {
    accesses.push({
      title: 'Tutoriales',
      description: 'Videos de ejercicios y técnicas',
      icon: 'video',
      route: 'Tutoriales',
      accent: palette.info,
    });
  }

  if (p.isAdmin || p.isProfesional) {
    if (p.hasPermission('usuarios:view')) {
      accesses.push({
        title: 'Socios',
        description: 'Administrá los socios',
        icon: 'account-group',
        route: 'Socios',
      });
    }
  }

  if ((p.isAdmin || p.isProfesional) && p.hasPermission('suscripciones:view')) {
    accesses.push({
      title: 'Suscripciones',
      description: 'Controlá vencimientos y pagos',
      icon: 'card-account-details',
      route: 'Suscripciones',
      accent: palette.primary,
    });
  }

  if (p.canManageEvaluaciones && p.hasPermission('evaluaciones:view')) {
    accesses.push({
      title: 'Evaluaciones',
      description: 'Seguimiento físico de socios',
      icon: 'clipboard-text',
      route: 'Evaluaciones',
      accent: palette.warning,
    });
  }

  return accesses;
}
