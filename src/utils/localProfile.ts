import { storage, STORAGE_KEYS } from '../services/api/storage';

export async function loadLocalNickname(userId: string): Promise<string> {
  if (!userId) return '';
  const raw = await storage.get(`${STORAGE_KEYS.LOCAL_PROFILE_NICKNAME}:${userId}`);
  return raw?.trim() ?? '';
}

export async function saveLocalNickname(userId: string, nickname: string): Promise<void> {
  if (!userId) return;
  const trimmed = nickname.trim();
  const key = `${STORAGE_KEYS.LOCAL_PROFILE_NICKNAME}:${userId}`;
  if (trimmed) {
    await storage.set(key, trimmed);
  } else {
    await storage.remove(key);
  }
}

export function getLocalDisplayName(
  nickname: string,
  nombre?: string,
  apellido?: string
): string {
  const nick = nickname.trim();
  if (nick) return nick;
  return [nombre, apellido].filter(Boolean).join(' ').trim() || 'Usuario';
}
