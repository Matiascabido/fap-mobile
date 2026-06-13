import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

interface AvatarProps {
  nombre?: string;
  apellido?: string;
  size?: number;
}

function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()?.[0] || '';
  const a = apellido?.trim()?.[0] || '';
  const initials = `${n}${a}`.toUpperCase();
  return initials || '?';
}

function Avatar({ nombre, apellido, size = 40 }: AvatarProps) {
  const initials = getInitials(nombre, apellido);
  const fontSize = size * 0.4;

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
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default React.memo(Avatar);
