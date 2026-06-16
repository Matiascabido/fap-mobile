import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const MAX_BACKGROUND_BYTES = 3 * 1024 * 1024; // 3 MB

const APPEARANCE_DIR = `${FileSystem.documentDirectory ?? ''}appearance`;
const BACKGROUND_FILENAME = 'custom-background.jpg';

export function getBackgroundFileUri(): string {
  return `${APPEARANCE_DIR}/${BACKGROUND_FILENAME}`;
}

async function ensureAppearanceDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(APPEARANCE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(APPEARANCE_DIR, { intermediates: true });
  }
}

export async function loadStoredBackgroundUri(): Promise<string | null> {
  try {
    const uri = getBackgroundFileUri();
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  } catch {
    return null;
  }
}

export async function pickAndSaveBackgroundImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos acceso a tus fotos para elegir un fondo personalizado.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
    aspect: [9, 16],
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  if (asset.fileSize != null && asset.fileSize > MAX_BACKGROUND_BYTES) {
    Alert.alert('Imagen muy pesada', 'Elegí una imagen de hasta 3 MB.');
    return null;
  }

  try {
    await ensureAppearanceDir();
    const dest = getBackgroundFileUri();

    const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
    if (sourceInfo.exists && 'size' in sourceInfo && typeof sourceInfo.size === 'number') {
      if (sourceInfo.size > MAX_BACKGROUND_BYTES) {
        Alert.alert('Imagen muy pesada', 'Elegí una imagen de hasta 3 MB.');
        return null;
      }
    }

    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    return dest;
  } catch {
    Alert.alert('Error', 'No se pudo guardar la imagen de fondo.');
    return null;
  }
}

export async function removeStoredBackgroundImage(): Promise<void> {
  try {
    const uri = getBackgroundFileUri();
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    /* ignore */
  }
}
