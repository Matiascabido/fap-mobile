import { useAuth } from './useAuth';
import { PermisoToken } from '../services/api/login.service';

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param codigo - Código del permiso (ej: "usuarios:view")
   * @param scopeRequired - Scope requerido ("all", "related", "own"). Si no se especifica, cualquier scope es válido
   */
  const hasPermission = (codigo: string, scopeRequired?: string): boolean => {
    if (!user || !user.permisos) return false;

    const permiso = user.permisos.find((p: PermisoToken) => p.codigo === codigo);
    if (!permiso) return false;

    if (!scopeRequired) return true;

    // Verificar scope específico
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
    if (!user || !user.permisos) return [];
    return user.permisos.map((p: PermisoToken) => p.codigo);
  };

  /**
   * Verifica si el usuario es administrador (rol GOD)
   */
  const isAdminUser = user?.rol === 'GOD';
  const isProfesionalUser = user?.rol === 'PROFESIONAL' || user?.rol === 'GOD';
  const isSocioUser = user?.rol === 'ENTRENADO';

  const isAdmin = (): boolean => isAdminUser;

  const isProfesional = (): boolean => isProfesionalUser;

  const isSocio = (): boolean => isSocioUser;

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionCodes,
    isAdmin,
    isProfesional,
    isSocio,
    isAdminUser,
    isProfesionalUser,
    isSocioUser,
  };
}
