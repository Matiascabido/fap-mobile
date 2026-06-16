import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { storage, STORAGE_KEYS } from '../services/api/storage';
import { MAX_PROFILE_PHOTO_BYTES, type LocalProfileData } from '../types/localProfile.types';

const PROFILE_DIR = `${FileSystem.documentDirectory ?? ''}profile`;

function nicknameKey(userId: string): string {
  return `${STORAGE_KEYS.LOCAL_PROFILE_NICKNAME}:${userId}`;
}

function photoPath(userId: string): string {
  return `${PROFILE_DIR}/avatar-${userId}.jpg`;
}

async function ensureProfileDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PROFILE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROFILE_DIR, { intermediates: true });
  }
}

export async function loadLocalNickname(userId: string): Promise<string> {
  if (!userId) return '';
  const raw = await storage.get(nicknameKey(userId));
  return raw?.trim() ?? '';
}

export async function saveLocalNickname(userId: string, nickname: string): Promise<void> {
  if (!userId) return;
  const trimmed = nickname.trim();
  if (trimmed) {
    await storage.set(nicknameKey(userId), trimmed);
  } else {
    await storage.remove(nicknameKey(userId));
  }
}

export async function loadProfilePhotoUri(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const uri = photoPath(userId);
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  } catch {
    return null;
  }
}

export async function pickAndSaveProfilePhoto(userId: string): Promise<string | null> {
  if (!userId) return null;

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos acceso a tus fotos para elegir una imagen de perfil.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  if (asset.fileSize != null && asset.fileSize > MAX_PROFILE_PHOTO_BYTES) {
    Alert.alert('Imagen muy pesada', 'Elegí una imagen de hasta 2 MB.');
    return null;
  }

  try {
    const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
    if (
      sourceInfo.exists &&
      'size' in sourceInfo &&
      typeof sourceInfo.size === 'number' &&
      sourceInfo.size > MAX_PROFILE_PHOTO_BYTES
    ) {
      Alert.alert('Imagen muy pesada', 'Elegí una imagen de hasta 2 MB.');
      return null;
    }

    await ensureProfileDir();
    const dest = photoPath(userId);
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    return dest;
  } catch {
    Alert.alert('Error', 'No se pudo guardar la foto de perfil.');
    return null;
  }
}

export async function removeProfilePhoto(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const uri = photoPath(userId);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    /* ignore */
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

export async function loadLocalProfile(userId: string): Promise<LocalProfileData> {
  const [nickname, photoUri] = await Promise.all([
    loadLocalNickname(userId),
    loadProfilePhotoUri(userId),
  ]);
  return { nickname, photoUri };
}
