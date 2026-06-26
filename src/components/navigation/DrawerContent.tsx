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
import { drawerItems, ROUTES } from '../../constants/navigation';
import { getRolLabel } from '../../utils/sessionRole';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout, profilePhotoUrl } = useAuth();
  const {
    hasPermission,
    isGodOrAdmin,
    isProfesional,
    isSocioSinPlan,
    canManageEvaluaciones,
  } = usePermissions();

  const rolLabel = getRolLabel(user);
  const isSocioSolo = isSocioSinPlan();

  /**
   * Determina si un ítem del drawer debe mostrarse.
   *
   * Reglas:
   * 1. Items sin scope → siempre visibles
   * 2. Socios solo plan club → solo Tutoriales + Métricas
   * 3. Modo legacy (sin permisos JWT): admin/profes ven todo
   * 4. Modo scoped: filtra por permiso JWT exacto
   * 5. Evaluaciones: solo visible para quienes pueden gestionarlas
   */
  const isItemVisible = (item: (typeof drawerItems)[0]): boolean => {
    // Inicio siempre visible
    if (!item.scope) return true;

    // Métricas siempre visible (sin scope en config)
    if (item.route === ROUTES.METRICAS) return true;

    // Socio club sin entrenamiento → solo Tutoriales + Métricas
    if (isSocioSolo) {
      return item.route === ROUTES.TUTORIALES || item.route === ROUTES.METRICAS;
    }

    // Evaluaciones: solo staff
    if (item.route === ROUTES.EVALUACIONES) {
      return canManageEvaluaciones();
    }

    // Socios: solo admin/profes
    if (item.route === ROUTES.SOCIOS) {
      return isGodOrAdmin() || isProfesional();
    }

    // Suscripciones: admin/profes también
    if (item.route === ROUTES.SUSCRIPCIONES) {
      return isGodOrAdmin() || isProfesional() || hasPermission(item.scope);
    }

    // Modo legacy: si no hay permisos JWT → permitir según rol
    const permisos = user?.permisos ?? [];
    if (permisos.length === 0) {
      // Admin y profes ven todo en modo legacy
      if (isGodOrAdmin() || isProfesional()) return true;
      // Socios/entrenados en legacy ven: Turnero, Planes, Tutoriales, Métricas
      return (
        item.route === ROUTES.TURNERO ||
        item.route === ROUTES.PLANES ||
        item.route === ROUTES.TUTORIALES ||
        item.route === ROUTES.METRICAS
      );
    }

    // Modo scoped: verificar permiso JWT
    return hasPermission(item.scope);
  };

  const visibleItems = drawerItems.filter(isItemVisible);
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
      {/* Header con datos del usuario */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Avatar
          nombre={user?.nombre}
          apellido={user?.apellido}
          size={56}
          imageUri={profilePhotoUrl}
        />
        <Text style={styles.userName} numberOfLines={1}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user?.mail}
        </Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="shield-account" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.roleText}>{rolLabel}</Text>
        </View>
      </View>

      {/* Navegación */}
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
              {isActive && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.perfilButton} onPress={() => props.navigation.navigate(ROUTES.PERFIL)}>
          <MaterialCommunityIcons name="account-circle" size={22} color={palette.slate300} />
          <Text style={styles.perfilButtonText}>Mi perfil</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  perfilButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  perfilButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate300,
    marginLeft: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fca5a5',
    marginLeft: 14,
  },
});
