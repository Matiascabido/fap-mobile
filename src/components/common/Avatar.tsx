import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { palette } from '../../constants/colors';

interface AvatarProps {
  nombre?: string;
  apellido?: string;
  size?: number;
  imageUri?: string | null;
}

function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()?.[0] || '';
  const a = apellido?.trim()?.[0] || '';
  const initials = `${n}${a}`.toUpperCase();
  return initials || '?';
}

function Avatar({ nombre, apellido, size = 40, imageUri }: AvatarProps) {
  const initials = getInitials(nombre, apellido);
  const fontSize = size * 0.4;

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityLabel="Foto de perfil"
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: palette.slate200,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default React.memo(Avatar);
