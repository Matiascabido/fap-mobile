import { useAuth } from './useAuth';
import {
  esRolGod,
  esRolAdmin,
  esRolGodOAdmin,
  esRolProfesional,
  esRolEntrenado,
  esRolSocioClub,
  esRolEntrnadoOff,
  puedeGestionarTurnosAdministracion,
  puedeInscribirseATurnos,
  puedeVerVistaMesTurnero,
  esPerfilSocioSinPlanEntrenamiento,
  esRolAdministradorMetricasExcel,
  puedeVerColumnaDniListadoSocios,
  puedeGestionarEvaluaciones,
  puedeGestionarSocios,
  getRolLabel,
} from '../utils/sessionRole';

export interface PermisoToken {
  codigo: string;
  scope: string;
}

/**
 * Hook para verificar permisos del usuario actual.
 * Combina permisos JWT (token scopes) con reglas de negocio por rol.
 */
export function usePermissions() {
  const { user } = useAuth();

  // ─── Permisos JWT ─────────────────────────────────────────────────────────

  /**
   * Verifica si el usuario tiene un permiso JWT específico
   * Soporta modo legacy (sin permisos en token → todo permitido para admins)
   */
  const hasPermission = (codigo: string, scopeRequired?: string): boolean => {
    if (!user) return false;

    // Modo legacy: si no hay permisos en el token, los admins/god tienen todo
    const permisos: PermisoToken[] = user.permisos ?? [];
    if (permisos.length === 0) {
      return esRolGodOAdmin(user) || esRolProfesional(user);
    }

    // Wildcard: el usuario tiene permiso * (dios)
    const wildcard = permisos.find((p) => p.codigo === '*');
    if (wildcard) return true;

    const permiso = permisos.find((p) => p.codigo === codigo);
    if (!permiso) return false;

    if (!scopeRequired) return true;
    return permiso.scope === scopeRequired || permiso.scope === 'all';
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = (codigos: string[]): boolean => {
    return codigos.some((codigo) => hasPermission(codigo));
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = (codigos: string[]): boolean => {
    return codigos.every((codigo) => hasPermission(codigo));
  };

  /**
   * Obtiene todos los códigos de permisos del usuario
   */
  const getPermissionCodes = (): string[] => {
    if (!user?.permisos) return [];
    return (user.permisos as PermisoToken[]).map((p) => p.codigo);
  };

  // ─── Roles (reglas de negocio) ────────────────────────────────────────────

  const isGod = () => esRolGod(user);
  const isAdmin = () => esRolAdmin(user);
  const isGodOrAdmin = () => esRolGodOAdmin(user);
  const isProfesional = () => esRolProfesional(user);
  const isEntrenado = () => esRolEntrenado(user);
  const isSocioClub = () => esRolSocioClub(user);
  const isEntrnadoOff = () => esRolEntrnadoOff(user);

  // Alias histórico (compatible con código existente)
  const isAdminUser = esRolGodOAdmin(user);
  const isProfesionalUser = esRolProfesional(user);
  const isSocioUser = esRolEntrenado(user) || esRolSocioClub(user);
  const isEntrnadoUser = esRolEntrenado(user);

  // ─── Capacidades funcionales ─────────────────────────────────────────────

  const canManageTurnos = () => puedeGestionarTurnosAdministracion(user);
  const canEnrollTurnos = () => puedeInscribirseATurnos(user);
  const canViewMonthCalendar = () => puedeVerVistaMesTurnero(user);
  const isSocioSinPlan = () => esPerfilSocioSinPlanEntrenamiento(user);
  const canExportMetricasExcel = () => esRolAdministradorMetricasExcel(user);
  const canViewAllDni = () => puedeVerColumnaDniListadoSocios(user);
  const canManageEvaluaciones = () => puedeGestionarEvaluaciones(user);
  const canManageSocios = () => puedeGestionarSocios(user);

  const rolLabel = getRolLabel(user);

  return {
    // JWT permissions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionCodes,
    // Role booleans (functions)
    isGod,
    isAdmin,
    isGodOrAdmin,
    isProfesional,
    isEntrenado,
    isSocioClub,
    isEntrnadoOff,
    // Role booleans (values - retrocompatibilidad)
    isAdminUser,
    isProfesionalUser,
    isSocioUser,
    isEntrnadoUser,
    // Functional capabilities
    canManageTurnos,
    canEnrollTurnos,
    canViewMonthCalendar,
    isSocioSinPlan,
    canExportMetricasExcel,
    canViewAllDni,
    canManageEvaluaciones,
    canManageSocios,
    rolLabel,
  };
}
