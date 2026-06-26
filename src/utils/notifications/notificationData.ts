import { suscripcionesService } from '../../services/api/suscripciones.service';
import { pagosCobranzasService } from '../../services/api/pagosCobranzas.service';
import type { SuscripcionData } from '../../types/suscripciones.types';
import type { PagoCobranza } from '../../services/api/pagosCobranzas.service';
import type { TurnoResponse, ListTurnosParams } from '../../types/turnero.types';
import { turneroService } from '../../services/api/turnero.service';
import { todayTomorrowRangeQueryParams } from '../dateRange';
import {
  esRolEntrenado,
  esRolSocioClub,
  esRolEntrnadoOff,
  esRolProfesional,
  esRolGodOAdmin,
  esEntrenadoConSuscripcion,
  puedeInscribirseATurnos,
  puedeGestionarTurnosAdministracion,
  type RolUser,
} from '../sessionRole';

/** Roles que deben evaluar alertas de suscripciones (misma cobertura que la pantalla Suscripciones). */
export function puedeRecibirAlertasSuscripciones(user: RolUser | null | undefined): boolean {
  if (!user) return false;
  return (
    esRolEntrenado(user) ||
    esRolSocioClub(user) ||
    esRolEntrnadoOff(user) ||
    esRolProfesional(user) ||
    esRolGodOAdmin(user)
  );
}

export type TurnoAlertMode = 'inscripto' | 'profesional';

export function getTurnoAlertMode(user: RolUser | null | undefined): TurnoAlertMode | null {
  if (!user) return null;
  if (esRolProfesional(user)) return 'profesional';
  if (
    puedeInscribirseATurnos(user) ||
    esRolEntrnadoOff(user) ||
    esEntrenadoConSuscripcion(user)
  ) {
    return 'inscripto';
  }
  return null;
}

export function puedeRecibirAlertasTurnos(user: RolUser | null | undefined): boolean {
  return getTurnoAlertMode(user) !== null;
}

export async function loadTurnosForNotifications(
  user: RolUser,
  userEmail?: string
): Promise<TurnoResponse[]> {
  const mode = getTurnoAlertMode(user);
  if (!mode) return [];

  const canManage = puedeGestionarTurnosAdministracion(user);
  const canEnroll = puedeInscribirseATurnos(user);
  const range = todayTomorrowRangeQueryParams();

  const params: ListTurnosParams = {
    desde: range.desde,
    hasta: range.hasta,
  };

  if (!canManage) {
    if (
      mode === 'inscripto' &&
      userEmail &&
      (canEnroll || esRolEntrnadoOff(user) || esEntrenadoConSuscripcion(user))
    ) {
      params.email_socio = userEmail;
    } else if (mode === 'profesional' && userEmail) {
      params.email_profesional = userEmail;
    }
  }

  try {
    return await turneroService.list(params);
  } catch {
    return [];
  }
}

/**
 * Misma fuente que SuscripcionesScreen (`getAll`) para que las alertas coincidan con el listado.
 */
export async function loadSuscripcionesForNotifications(
  _user: RolUser,
  _userId: string
): Promise<SuscripcionData[]> {
  try {
    return await suscripcionesService.getAll({ limit: 200 });
  } catch {
    return [];
  }
}

export async function loadPagosForNotifications(
  user: RolUser,
  userId: string
): Promise<PagoCobranza[]> {
  if (esRolGodOAdmin(user) || esRolProfesional(user)) {
    return pagosCobranzasService.getAll({ limit: 300 }).catch(() => []);
  }
  return pagosCobranzasService.getAll({ id_usuario_socio: userId, limit: 100 }).catch(() => []);
}
