import { parseISO, isValid } from 'date-fns';
import { TurnoResponse } from '../../types/turnero.types';
import { SuscripcionData } from '../../types/suscripciones.types';
import { PagoCobranza } from '../../services/api/pagosCobranzas.service';
import {
  nombreParticipante,
  suscripcionProfesional,
} from '../../services/api/suscripciones.service';
import { AppNotification, NotificationSettings } from '../../types/notifications.types';
import { diasHastaVencimiento, parseFechaLocal } from '../../utils/fechasAlertas';
import { fechaVencimientoSuscripcion } from '../../utils/suscripcionFecha';
import { estaInscriptoEnTurno } from '../../utils/turnoInscripcion';
import { formatTime } from '../../utils/formatters';

function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTurnoStart(raw: string): Date | null {
  try {
    const parsed = parseISO(raw);
    if (isValid(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  const native = new Date(raw.includes('T') ? raw : raw.replace(/-/g, '/'));
  return Number.isNaN(native.getTime()) ? null : native;
}

function diasConPlan(createdRaw: string | null | undefined): number | null {
  const created = parseFechaLocal(createdRaw);
  if (!created) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - created.getTime()) / 86_400_000);
}

function diasConPlanLabel(dias: number): string {
  if (dias === 0) return 'empezaste hoy';
  if (dias === 1) return '1 día';
  return `${dias} días`;
}

function validationFooter(profesionalNombre: string | null): string {
  if (profesionalNombre) {
    return `Si ya pagaste, pedile a ${profesionalNombre} que registre el pago.`;
  }
  return 'Si ya pagaste, pedile a tu profesional que registre el pago.';
}

function suscripcionTienePagoReciente(
  suscripcionId: string,
  pagos: PagoCobranza[]
): boolean {
  const now = new Date();
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return pagos.some((p) => {
    if (p.id_suscripcion && p.id_suscripcion !== suscripcionId) return false;
    if (p.periodo_referencia?.startsWith(mesActual)) return true;
    if (!p.fecha_pago) return false;
    const fp = parseTurnoStart(p.fecha_pago);
    if (!fp) return false;
    return (
      fp.getFullYear() === now.getFullYear() &&
      fp.getMonth() === now.getMonth()
    );
  });
}

function shouldSuppressSuscripcionNotification(
  suscripcion: SuscripcionData,
  dias: number,
  pagos: PagoCobranza[]
): boolean {
  if (dias > 5) return true;
  if (dias >= 0 && dias <= 5) return false;
  // vencida: suprimir si hay pago reciente y ya no está en ventana de alerta
  if (dias < 0 && suscripcionTienePagoReciente(suscripcion.id, pagos)) {
    return true;
  }
  return false;
}

export interface EvaluateNotificationsInput {
  turnos: TurnoResponse[];
  suscripciones: SuscripcionData[];
  pagos: PagoCobranza[];
  userId: string;
  userEmail?: string;
  settings: NotificationSettings;
  dismissedKeys: Set<string>;
  canEnrollTurnos: boolean;
  includeSuscripciones: boolean;
}

function filterDismissed(
  notifications: AppNotification[],
  dismissedKeys: Set<string>
): AppNotification[] {
  return notifications.filter((n) => !dismissedKeys.has(n.id));
}

export function evaluateNotifications(input: EvaluateNotificationsInput): AppNotification[] {
  if (input.settings.muted) {
    return [];
  }

  const candidates: AppNotification[] = [];
  const now = Date.now();
  const todayYmd = todayYmdLocal();

  if (input.canEnrollTurnos) {
    for (const turno of input.turnos) {
      if (turno.cancelado) continue;
      if (!estaInscriptoEnTurno(turno, input.userId, input.userEmail)) continue;

      const start = parseTurnoStart(turno.fecha_inicio);
      if (!start) continue;
      const startMs = start.getTime();
      if (startMs <= now) continue;

      const leadMs = input.settings.turnLeadMinutes * 60_000;
      const windowStart = startMs - leadMs;
      if (now < windowStart || now >= startMs) continue;

      const id = `turno:${turno.id_turno}:pre`;
      const titulo = turno.titulo?.trim() || turno.serie?.titulo?.trim() || 'Turno';
      candidates.push({
        id,
        type: 'turno_proximo',
        title: 'Tu turno comienza pronto',
        body: `${titulo} empieza a las ${formatTime(turno.fecha_inicio)}.`,
        createdAt: new Date().toISOString(),
        targetRoute: 'Turnero',
      });
    }
  }

  if (input.includeSuscripciones) {
    for (const suscripcion of input.suscripciones) {
      const fechaVenc = fechaVencimientoSuscripcion(suscripcion);
      const dias = diasHastaVencimiento(fechaVenc);
      const plan = suscripcion.suscripcion_detalle?.nombre?.trim() || 'Suscripción';

      if (
        input.settings.planTenureEnabled &&
        dias != null &&
        dias >= 0
      ) {
        const diasPlan = diasConPlan(suscripcion.created_date);
        if (diasPlan != null && diasPlan >= 0) {
          const id = `suscripcion:${suscripcion.id}:tenure:${todayYmd}`;
          candidates.push({
            id,
            type: 'suscripcion_antiguedad',
            title: 'Tu plan activo',
            body: `Llevás ${diasConPlanLabel(diasPlan)} con ${plan}.`,
            createdAt: new Date().toISOString(),
            targetRoute: 'Suscripciones',
          });
        }
      }

      if (dias == null) continue;
      if (shouldSuppressSuscripcionNotification(suscripcion, dias, input.pagos)) continue;

      const profe = nombreParticipante(suscripcionProfesional(suscripcion));
      const footer = validationFooter(profe !== '—' ? profe : null);

      if (dias >= 0 && dias <= 5) {
        const id = `suscripcion:${suscripcion.id}:pre:${dias}`;
        const diasText =
          dias === 0
            ? 'vence hoy'
            : dias === 1
              ? 'vence mañana'
              : `vence en ${dias} días`;

        candidates.push({
          id,
          type: 'suscripcion_por_vencer',
          title: 'Suscripción por vencer',
          body: `${plan} ${diasText}. ${footer}`,
          createdAt: new Date().toISOString(),
          targetRoute: 'Suscripciones',
        });
        continue;
      }

      if (dias < 0) {
        const id = `suscripcion:${suscripcion.id}:post:${todayYmd}`;
        const diasVencidos = Math.abs(dias);
        const vencidoText =
          diasVencidos === 1 ? 'venció ayer' : `venció hace ${diasVencidos} días`;

        candidates.push({
          id,
          type: 'suscripcion_vencida',
          title: 'Suscripción vencida',
          body: `${plan} ${vencidoText}. Ponete al día con tu abono. ${footer}`,
          createdAt: new Date().toISOString(),
          targetRoute: 'Suscripciones',
        });
      }
    }
  }

  return filterDismissed(candidates, input.dismissedKeys);
}
