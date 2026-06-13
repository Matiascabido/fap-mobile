import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

type ThemeOption = 'light' | 'dark' | 'auto';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark, setTheme } = useTheme();
  const { getPermissionCodes } = usePermissions();

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const permisos = getPermissionCodes();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const themeOptions: { key: ThemeOption; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'light', label: 'Claro', icon: 'weather-sunny' },
    { key: 'dark', label: 'Oscuro', icon: 'weather-night' },
    { key: 'auto', label: 'Automático', icon: 'theme-light-dark' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.content}>
      {/* Header de perfil */}
      <View style={styles.profileHeader}>
        <Avatar nombre={user?.nombre} apellido={user?.apellido} size={88} />
        <Text style={[styles.profileName, { color: textPrimary }]}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={[styles.profileEmail, { color: textSecondary }]}>{user?.mail}</Text>
        <View style={styles.badgeRow}>
          <Badge label={user?.rol || 'Usuario'} variant="info" />
          {user?.grupo ? <Badge label={user.grupo} variant="neutral" /> : null}
        </View>
      </View>

      {/* Datos de la cuenta */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Datos de la cuenta</Text>
        <InfoRow icon="card-account-details" label="DNI" value={user?.dni || '-'} textPrimary={textPrimary} textSecondary={textSecondary} borderColor={borderColor} />
        <InfoRow icon="email" label="Email" value={user?.mail || '-'} textPrimary={textPrimary} textSecondary={textSecondary} borderColor={borderColor} />
        <InfoRow icon="shield-account" label="Rol" value={user?.rol || '-'} textPrimary={textPrimary} textSecondary={textSecondary} borderColor={borderColor} />
        <InfoRow
          icon="check-circle"
          label="Estado"
          value={user?.estado ? 'Activo' : 'Inactivo'}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
          isLast
        />
      </Card>

      {/* Apariencia */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Apariencia</Text>
        <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
          Elegí el tema de la aplicación
        </Text>
        <View style={styles.themeOptions}>
          {themeOptions.map((option) => {
            const isSelected = theme === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: isSelected ? palette.primary : 'transparent',
                    borderColor: isSelected ? palette.primary : borderColor,
                  },
                ]}
                onPress={() => setTheme(option.key)}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={24}
                  color={isSelected ? '#FFFFFF' : textSecondary}
                />
                <Text
                  style={[styles.themeOptionText, { color: isSelected ? '#FFFFFF' : textPrimary }]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Permisos */}
      {permisos.length > 0 && (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Permisos ({permisos.length})
          </Text>
          <View style={styles.permisosGrid}>
            {permisos.slice(0, 12).map((permiso) => (
              <View key={permiso} style={[styles.permisoChip, { backgroundColor: `${palette.info}15` }]}>
                <Text style={[styles.permisoText, { color: palette.info }]}>{permiso}</Text>
              </View>
            ))}
            {permisos.length > 12 && (
              <Text style={[styles.morePermisos, { color: textSecondary }]}>
                +{permisos.length - 12} más
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* Acerca de */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Información</Text>
        <MenuRow
          icon="information"
          label="Versión de la app"
          value="1.0.0"
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
        />
        <MenuRow
          icon="help-circle"
          label="Ayuda y soporte"
          onPress={() => Linking.openURL('mailto:soporte@fap.com.ar')}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
          isLast
        />
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={22} color="#FFFFFF" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: textSecondary }]}>
        FAP · Funcional Atlético Personalizado
      </Text>
    </ScrollView>
  );
}

interface InfoRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  isLast?: boolean;
}

function InfoRow({ icon, label, value, textPrimary, textSecondary, borderColor, isLast }: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={textSecondary} />
      <Text style={[styles.infoLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

interface MenuRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  isLast?: boolean;
}

function MenuRow({ icon, label, value, onPress, textPrimary, textSecondary, borderColor, isLast }: MenuRowProps) {
  const content = (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={textSecondary} />
      <Text style={[styles.infoLabel, { color: textPrimary }]}>{label}</Text>
      {value ? (
        <Text style={[styles.infoValue, { color: textSecondary }]}>{value}</Text>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  permisosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  permisoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  permisoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  morePermisos: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.error,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
