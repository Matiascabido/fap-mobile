import { storage, STORAGE_KEYS } from '../../services/api/storage';

function storageKey(userId: string): string {
  return `${STORAGE_KEYS.NOTIFICATION_DISMISSED}:${userId}`;
}

export async function loadDismissedKeys(userId: string): Promise<Set<string>> {
  const raw = await storage.get(storageKey(userId));
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export async function saveDismissedKeys(userId: string, keys: Set<string>): Promise<void> {
  await storage.set(storageKey(userId), JSON.stringify([...keys]));
}

export async function dismissNotificationKey(userId: string, key: string): Promise<void> {
  const keys = await loadDismissedKeys(userId);
  keys.add(key);
  await saveDismissedKeys(userId, keys);
}

export async function dismissNotificationKeys(userId: string, notificationKeys: string[]): Promise<void> {
  if (notificationKeys.length === 0) return;
  const keys = await loadDismissedKeys(userId);
  notificationKeys.forEach((k) => keys.add(k));
  await saveDismissedKeys(userId, keys);
}

export async function clearDismissedKeys(userId: string): Promise<void> {
  await storage.remove(storageKey(userId));
}
