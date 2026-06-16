import type { AppNotification } from '../../types/notifications.types';

/** Muestra notificaciones de ejemplo en la bandeja (solo sesión, sin backend). */
export const ENABLE_NOTIFICATION_DEMOS = true;

export function isDemoNotificationId(id: string): boolean {
  return id.startsWith('demo:');
}

export function createDemoNotifications(): AppNotification[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo:turno:pre',
      type: 'turno_proximo',
      title: 'Tu turno comienza pronto',
      body: 'Funcional 18:00 empieza a las 18:00.',
      createdAt: now,
      targetRoute: 'Turnero',
      isDemo: true,
    },
    {
      id: 'demo:suscripcion:pre:3',
      type: 'suscripcion_por_vencer',
      title: 'Suscripción por vencer',
      body: 'Plan Mensual vence en 3 días. Si ya pagaste, pedile a tu profesional que registre el pago.',
      createdAt: now,
      targetRoute: 'Suscripciones',
      isDemo: true,
    },
    {
      id: 'demo:suscripcion:tenure:today',
      type: 'suscripcion_antiguedad',
      title: 'Tu plan activo',
      body: 'Llevás 45 días con Plan Mensual.',
      createdAt: now,
      targetRoute: 'Suscripciones',
      isDemo: true,
    },
    {
      id: 'demo:suscripcion:post:today',
      type: 'suscripcion_vencida',
      title: 'Suscripción vencida',
      body: 'Plan Mensual venció hace 2 días. Ponete al día con tu abono. Si ya pagaste, pedile a tu profesional que registre el pago.',
      createdAt: now,
      targetRoute: 'Suscripciones',
      isDemo: true,
    },
  ];
}
