import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { drawerItems } from '../../constants/navigation';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const visibleItems = drawerItems.filter((item) => {
    if (!item.scope) return true;
    return hasPermission(item.scope);
  });

  const currentRoute = props.state.routeNames[props.state.index];

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Avatar nombre={user?.nombre} apellido={user?.apellido} size={56} />
        <Text style={styles.userName} numberOfLines={1}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user?.mail}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.rol}</Text>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => props.navigation.navigate(item.route)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={isActive ? '#FFFFFF' : palette.slate300}
              />
              <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#fca5a5" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate800,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
    color: palette.slate400,
  },
  roleBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 16,
  },
  menuItemActive: {
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
    color: palette.slate200,
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fca5a5',
    marginLeft: 14,
  },
});
