import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';
import { canUploadProfilePhoto } from '../../constants/appTier';
import { uploadFotoPerfil } from '../../services/api/users.service';
import { HttpRequestError, UnauthorizedSessionError } from '../../services/api/http';
import { useAuth } from '../../hooks/useAuth';
import {
  FOTO_PERFIL_ELITE_MESSAGE,
  FOTO_PERFIL_REQUIREMENTS_HINT,
  FOTO_PERFIL_UPLOAD_ERROR_MESSAGE,
} from '../../utils/perfilFotoUpload';
import {
  optimizeProfileImage,
  optimizedProfileFileName,
} from '../../utils/optimizeProfileImage';

type UploadPhase = 'idle' | 'picking' | 'optimizing' | 'uploading';

interface ProfileAvatarUploadProps {
  usuarioId: string;
  nombre?: string;
  apellido?: string;
  fotoUrl?: string | null;
  size?: number;
}

function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()?.[0] || '';
  const a = apellido?.trim()?.[0] || '';
  return `${n}${a}`.toUpperCase() || '?';
}

function formatKb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ProfileAvatarUpload({
  usuarioId,
  nombre,
  apellido,
  fotoUrl,
  size = 88,
}: ProfileAvatarUploadProps) {
  const { updateUser, bumpProfilePhotoCache } = useAuth();
  const canUpload = canUploadProfilePhoto();
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const displayUri = previewUri ?? fotoUrl ?? null;
  const initials = getInitials(nombre, apellido);
  const busy = phase !== 'idle';

  const revertPreview = useCallback(() => {
    setPreviewUri(null);
  }, []);

  const handleUploadError = useCallback(
    (error: unknown) => {
      revertPreview();
      if (error instanceof UnauthorizedSessionError) return;

      let message = FOTO_PERFIL_UPLOAD_ERROR_MESSAGE;
      if (error instanceof HttpRequestError) {
        switch (error.status) {
          case 403:
            message = 'No tenés los permisos necesarios para esta acción.';
            break;
          case 404:
            message =
              'El servidor aún no tiene habilitada la subida de foto. Probá de nuevo más tarde.';
            break;
          case 413:
            message = FOTO_PERFIL_REQUIREMENTS_HINT;
            break;
          case 422:
            message = error.message || FOTO_PERFIL_UPLOAD_ERROR_MESSAGE;
            break;
          default:
            if (error.message) message = error.message;
        }
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      Alert.alert('Error', message);
    },
    [revertPreview]
  );

  const runUpload = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      setPhase('optimizing');
      try {
        const optimized = await optimizeProfileImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
        });

        setPreviewUri(optimized.uri);
        setPhase('uploading');

        const { fotoUrl: uploadedUrl } = await uploadFotoPerfil(usuarioId, {
          uri: optimized.uri,
          name: optimizedProfileFileName(optimized.mimeType),
          type: optimized.mimeType,
        });

        if (!uploadedUrl) {
          throw new Error(FOTO_PERFIL_UPLOAD_ERROR_MESSAGE);
        }

        await updateUser({ foto_url: uploadedUrl });
        bumpProfilePhotoCache();
        setPreviewUri(null);

        Alert.alert(
          'Foto actualizada',
          `${optimized.width}x${optimized.height}, ${formatKb(optimized.optimizedBytes)}.`
        );
      } catch (error) {
        handleUploadError(error);
      } finally {
        setPhase('idle');
      }
    },
    [usuarioId, updateUser, bumpProfilePhotoCache, handleUploadError]
  );

  const pickFromLibrary = useCallback(async () => {
    setPhase('picking');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tus fotos para elegir una imagen de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets[0]) return;
      await runUpload(result.assets[0]);
    } catch (error) {
      handleUploadError(error);
    } finally {
      setPhase('idle');
    }
  }, [runUpload, handleUploadError]);

  const pickFromCamera = useCallback(async () => {
    setPhase('picking');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a la cámara para sacar una foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets[0]) return;
      await runUpload(result.assets[0]);
    } catch (error) {
      handleUploadError(error);
    } finally {
      setPhase('idle');
    }
  }, [runUpload, handleUploadError]);

  const openPicker = useCallback(() => {
    if (!canUpload || busy) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Galería', 'Cámara', 'Cancelar'],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) void pickFromLibrary();
          if (index === 1) void pickFromCamera();
        }
      );
      return;
    }

    Alert.alert('Foto de perfil', 'Elegí una opción', [
      { text: 'Galería', onPress: () => void pickFromLibrary() },
      { text: 'Cámara', onPress: () => void pickFromCamera() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [canUpload, busy, pickFromLibrary, pickFromCamera]);

  const avatarContent = useMemo(() => {
    if (displayUri) {
      return (
        <Image
          source={{ uri: displayUri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          accessibilityLabel="Foto de perfil"
        />
      );
    }

    return (
      <View
        style={[
          styles.initialsWrap,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    );
  }, [displayUri, size, initials]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.avatarRing,
          { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 },
        ]}
      >
        {avatarContent}
        {busy ? (
          <View style={[styles.overlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
        {canUpload ? (
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={openPicker}
            disabled={busy}
            accessibilityLabel="Cambiar foto de perfil"
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {!canUpload ? <Text style={styles.eliteHint}>{FOTO_PERFIL_ELITE_MESSAGE}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 4,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: `${palette.primary}55`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    backgroundColor: palette.slate200,
  },
  initialsWrap: {
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  eliteHint: {
    marginTop: 10,
    fontSize: 12,
    color: palette.slate500,
    textAlign: 'center',
    maxWidth: 220,
  },
});
