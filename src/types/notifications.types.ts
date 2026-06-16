export type NotificationType =
  | 'turno_proximo'
  | 'suscripcion_por_vencer'
  | 'suscripcion_vencida'
  | 'suscripcion_antiguedad';

export type NotificationTargetRoute = 'Turnero' | 'Suscripciones';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  targetRoute: NotificationTargetRoute;
  isDemo?: boolean;
}

export interface NotificationSettings {
  turnLeadMinutes: number;
  muted: boolean;
  planTenureEnabled: boolean;
}

export const DEFAULT_TURN_LEAD_MINUTES = 30;

export const TURN_LEAD_OPTIONS = [15, 30, 45, 60] as const;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  turnLeadMinutes: DEFAULT_TURN_LEAD_MINUTES,
  muted: false,
  planTenureEnabled: true,
};
