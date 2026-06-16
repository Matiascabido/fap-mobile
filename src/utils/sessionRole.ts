/**
 * Utilidades de detección y reglas de negocio por rol.
 * Replica la lógica de sessionRole.ts del frontend web.
 */

export interface RolUser {
  rol?: string | { nombre_rol?: string } | null;
  id_rol?: string;
  grupo?: string | null;
}

/** UUIDs fijos de roles en BD */
export const ROLE_IDS = {
  ADMIN: '5fba458e-7e4c-40c8-83f9-2bfe30badb89',
  SOCIO: 'e80e92ac-95e3-4cc8-8573-88d595a66873',
  PROFESOR: '306b74ec-8828-489f-aa41-5d42177fcffe',
} as const;

/**
 * Extrae el nombre del rol normalizado (trim + toUpperCase)
 * desde user.rol (string u objeto { nombre_rol })
 */
export function getRolNombre(user: RolUser | null | undefined): string {
  if (!user) return '';
  const rol = user.rol;
  if (!rol) return '';
  if (typeof rol === 'string') return rol.trim().toUpperCase();
  if (typeof rol === 'object' && rol.nombre_rol) {
    return rol.nombre_rol.trim().toUpperCase();
  }
  return '';
}

/** GOD exacto */
export function esRolGod(user: RolUser | null | undefined): boolean {
  return getRolNombre(user) === 'GOD';
}

/** ADMIN o ADMINISTRATOR */
export function esRolAdmin(user: RolUser | null | undefined): boolean {
  const rol = getRolNombre(user);
  return rol === 'ADMIN' || rol === 'ADMINISTRATOR';
}

/** GOD o ADMIN */
export function esRolGodOAdmin(user: RolUser | null | undefined): boolean {
  return esRolGod(user) || esRolAdmin(user);
}

/** PROFES, PROFE, INSTRUCTOR, PROFESSIONAL */
export function esRolProfesional(user: RolUser | null | undefined): boolean {
  const rol = getRolNombre(user);
  return (
    rol === 'PROFES' ||
    rol === 'PROFE' ||
    rol === 'INSTRUCTOR' ||
    rol === 'PROFESSIONAL' ||
    rol === 'PROFESOR'
  );
}

/** ENTRENADO o ALUMNO */
export function esRolEntrenado(user: RolUser | null | undefined): boolean {
  const rol = getRolNombre(user);
  return rol === 'ENTRENADO' || rol === 'ALUMNO';
}

/** SOCIO (club, sin entrenamiento) */
export function esRolSocioClub(user: RolUser | null | undefined): boolean {
  return getRolNombre(user) === 'SOCIO';
}

/** ENTRENADO OFF (rol legacy en token; el grupo suele ser «Entrenados Off»). */
export function esRolEntrnadoOff(user: RolUser | null | undefined): boolean {
  const rol = getRolNombre(user);
  return rol === 'ENTRENADO OFF' || rol === 'ENTRENADO_OFF';
}

export function getGrupoNombre(user: RolUser | null | undefined): string {
  if (!user?.grupo) return '';
  return String(user.grupo).trim();
}

/**
 * Entrenado/alumno con suscripción activa (grupo Entrenados) o vencida (Entrenados Off).
 */
export function esEntrenadoConSuscripcion(user: RolUser | null | undefined): boolean {
  if (!esRolEntrenado(user)) return false;
  const g = getGrupoNombre(user).toLowerCase();
  return g === 'entrenados' || g === 'entrenados off';
}

/**
 * Puede GESTIONAR turnos (CRUD): GOD, ADMIN, PROFES
 */
export function puedeGestionarTurnosAdministracion(
  user: RolUser | null | undefined
): boolean {
  return esRolGod(user) || esRolAdmin(user) || esRolProfesional(user);
}

/**
 * Puede inscribirse a turnos (NO staff): SOCIO, ENTRENADO, ALUMNO
 */
export function puedeInscribirseATurnos(user: RolUser | null | undefined): boolean {
  if (esRolProfesional(user) || esRolGodOAdmin(user)) return false;
  if (esRolEntrnadoOff(user)) return false;
  const rol = getRolNombre(user);
  if (!rol) return false;
  return rol.includes('SOCIO') || rol.includes('ENTRENADO') || rol.includes('ALUMNO');
}

/**
 * Puede ver vista mes del turnero: staff + entrenado con suscripción (activa o vencida).
 */
export function puedeVerVistaMesTurnero(user: RolUser | null | undefined): boolean {
  return (
    esRolGod(user) ||
    esRolAdmin(user) ||
    esRolProfesional(user) ||
    esEntrenadoConSuscripcion(user)
  );
}

/**
 * Perfil de socio sin plan de entrenamiento (solo videos / tutoriales):
 * SOCIO club, o rol sin historial de suscripción de entrenamiento.
 */
export function esPerfilSocioSinPlanEntrenamiento(
  user: RolUser | null | undefined
): boolean {
  if (esEntrenadoConSuscripcion(user)) return false;
  return esRolSocioClub(user) || esRolEntrnadoOff(user);
}

/**
 * GOD/ADMIN pueden exportar Excel de métricas
 */
export function esRolAdministradorMetricasExcel(
  user: RolUser | null | undefined
): boolean {
  return esRolGod(user) || esRolAdmin(user);
}

/**
 * GOD/ADMIN ven columna DNI de todos los socios;
 * PROFES solo la ve en filas de socio/entrenado
 */
export function puedeVerColumnaDniListadoSocios(
  user: RolUser | null | undefined
): boolean {
  return esRolGod(user) || esRolAdmin(user);
}

/**
 * Puede ver y gestionar evaluaciones (admin/staff)
 */
export function puedeGestionarEvaluaciones(
  user: RolUser | null | undefined
): boolean {
  return esRolGod(user) || esRolAdmin(user) || esRolProfesional(user);
}

/**
 * Puede crear/editar socios (admin/staff)
 */
export function puedeGestionarSocios(user: RolUser | null | undefined): boolean {
  return esRolGod(user) || esRolAdmin(user) || esRolProfesional(user);
}

/**
 * Devuelve un label legible del rol para mostrar en UI
 */
export function getRolLabel(user: RolUser | null | undefined): string {
  const rol = getRolNombre(user);
  const labels: Record<string, string> = {
    GOD: 'Administrador',
    ADMIN: 'Administrador',
    ADMINISTRATOR: 'Administrador',
    PROFES: 'Profesional',
    PROFE: 'Profesional',
    INSTRUCTOR: 'Instructor',
    PROFESSIONAL: 'Profesional',
    PROFESOR: 'Profesional',
    ENTRENADO: 'Entrenado',
    ALUMNO: 'Alumno',
    SOCIO: 'Socio',
    'ENTRENADO OFF': 'Entrenado (inactivo)',
    ENTRENADO_OFF: 'Entrenado (inactivo)',
  };
  return labels[rol] || rol || 'Usuario';
}
