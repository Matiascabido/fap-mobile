import { storage, STORAGE_KEYS } from '../../services/api/storage';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  TURN_LEAD_OPTIONS,
} from '../../types/notifications.types';

function parseTurnLeadMinutes(raw: string | null): number {
  if (!raw) return DEFAULT_NOTIFICATION_SETTINGS.turnLeadMinutes;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !TURN_LEAD_OPTIONS.includes(parsed as (typeof TURN_LEAD_OPTIONS)[number])) {
    return DEFAULT_NOTIFICATION_SETTINGS.turnLeadMinutes;
  }
  return parsed;
}

function parseBoolean(raw: string | null, fallback: boolean): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const [minutesRaw, mutedRaw, tenureRaw] = await Promise.all([
    storage.get(STORAGE_KEYS.NOTIFICATION_TURN_LEAD_MINUTES),
    storage.get(STORAGE_KEYS.NOTIFICATION_MUTED),
    storage.get(STORAGE_KEYS.NOTIFICATION_PLAN_TENURE),
  ]);

  return {
    turnLeadMinutes: parseTurnLeadMinutes(minutesRaw),
    muted: parseBoolean(mutedRaw, DEFAULT_NOTIFICATION_SETTINGS.muted),
    planTenureEnabled: parseBoolean(tenureRaw, DEFAULT_NOTIFICATION_SETTINGS.planTenureEnabled),
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await Promise.all([
    storage.set(STORAGE_KEYS.NOTIFICATION_TURN_LEAD_MINUTES, String(settings.turnLeadMinutes)),
    storage.set(STORAGE_KEYS.NOTIFICATION_MUTED, String(settings.muted)),
    storage.set(STORAGE_KEYS.NOTIFICATION_PLAN_TENURE, String(settings.planTenureEnabled)),
  ]);
}

export async function saveTurnLeadMinutes(minutes: number): Promise<void> {
  await storage.set(STORAGE_KEYS.NOTIFICATION_TURN_LEAD_MINUTES, String(minutes));
}

export async function saveNotificationsMuted(muted: boolean): Promise<void> {
  await storage.set(STORAGE_KEYS.NOTIFICATION_MUTED, String(muted));
}

export async function savePlanTenureEnabled(enabled: boolean): Promise<void> {
  await storage.set(STORAGE_KEYS.NOTIFICATION_PLAN_TENURE, String(enabled));
}
