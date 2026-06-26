import { userStorage } from '../services/api/storage';
import type { Usuario } from '../services/api/login.service';

export async function getUserData(): Promise<Usuario | null> {
  return userStorage.getUser();
}

export async function patchUserData(patch: Partial<Usuario>): Promise<Usuario | null> {
  const current = await userStorage.getUser();
  if (!current) return null;
  const updated = { ...current, ...patch };
  await userStorage.setUser(updated);
  return updated;
}

export async function syncFotoUrlFromApi(fotoUrl?: string | null): Promise<Usuario | null> {
  const trimmed = fotoUrl?.trim();
  if (!trimmed) return getUserData();
  const current = await userStorage.getUser();
  if (!current || current.foto_url === trimmed) return current;
  return patchUserData({ foto_url: trimmed });
}
