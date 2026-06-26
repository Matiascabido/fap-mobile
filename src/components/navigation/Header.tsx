import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface HeaderProps {
  navigation: DrawerNavigationProp<any>;
  title: string;
}

export default function Header({ navigation, title }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, profilePhotoUrl } = useAuth();
  const { isDark } = useTheme();

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const textColor = isDark ? palette.darkTextPrimary : palette.slate900;

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor: bgColor,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            accessibilityLabel="Abrir menú"
          >
            <MaterialCommunityIcons name="menu" size={26} color={textColor} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={[styles.brand, { color: palette.primary }]}>FAP</Text>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Perfil')}
            accessibilityLabel="Ir a perfil"
            style={styles.avatarButton}
          >
            <Avatar
              nombre={user?.nombre}
              apellido={user?.apellido}
              size={38}
              imageUri={profilePhotoUrl}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  brand: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
