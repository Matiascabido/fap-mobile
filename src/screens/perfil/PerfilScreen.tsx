import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import {
  pagosCobranzasService,
  PagoCobranza,
  ResumenMes,
} from '../../services/api/pagosCobranzas.service';
import { getRolLabel } from '../../utils/sessionRole';

import AppearanceSettings from '../../components/settings/AppearanceSettings';
import LocalProfileSettings from '../../components/perfil/LocalProfileSettings';
import { useLocalProfile } from '../../context/LocalProfileContext';

const MEDIO_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  MERCADOPAGO: 'MercadoPago',
  OTRO: 'Otro',
};

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const { displayName, hasNickname, photoUri } = useLocalProfile();
  const { getPermissionCodes, isProfesionalUser, isAdminUser, isSocioUser, hasPermission } =
    usePermissions();

  const bgColor = colors.hasBackgroundImage ? 'transparent' : colors.groupedBackground;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const permisos = getPermissionCodes();
  const rolLabel = getRolLabel(user);
  const canVerCobranzas = hasPermission('cobranzas:view') || isProfesionalUser || isAdminUser;

  // Cobranzas
  const [pagos, setPagos] = useState<PagoCobranza[]>([]);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [loadingPagos, setLoadingPagos] = useState(false);

  const loadCobranzas = useCallback(async () => {
    if (!user || !canVerCobranzas) return;
    setLoadingPagos(true);
    try {
      const params =
        isProfesionalUser && !isAdminUser
          ? { id_usuario_profesional: user.id, limit: 20 }
          : isSocioUser
          ? { id_usuario_socio: user.id, limit: 20 }
          : { limit: 20 };

      const mes = new Date().toISOString().slice(0, 7);
      const [pagosData, resumenData] = await Promise.all([
        pagosCobranzasService.getAll(params).catch(() => []),
        pagosCobranzasService
          .getResumenMes(mes, isProfesionalUser && !isAdminUser ? user.id : undefined)
          .catch(() => null),
      ]);
      setPagos(pagosData);
      setResumen(resumenData);
    } finally {
      setLoadingPagos(false);
    }
  }, [user, canVerCobranzas, isProfesionalUser, isAdminUser, isSocioUser]);

  useFocusEffect(
    useCallback(() => {
      void loadCobranzas();
    }, [loadCobranzas])
  );

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


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header de perfil */}
      <View style={styles.profileHeader}>
        <Avatar
          nombre={user?.nombre}
          apellido={user?.apellido}
          size={88}
          imageUri={photoUri}
        />
        <Text style={[styles.profileName, { color: textPrimary }]}>{displayName}</Text>
        {hasNickname ? (
          <Text style={[styles.profileLegalName, { color: textSecondary }]}>
            {user?.nombre} {user?.apellido}
          </Text>
        ) : null}
        <Text style={[styles.profileEmail, { color: textSecondary }]}>{user?.mail}</Text>
        <View style={styles.badgeRow}>
          <Badge label={rolLabel} variant="info" />
          {user?.grupo ? <Badge label={user.grupo} variant="neutral" /> : null}
        </View>
      </View>

      <Card style={styles.section}>
        <LocalProfileSettings
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
          nombre={user?.nombre}
          apellido={user?.apellido}
        />
      </Card>

      {/* Datos de la cuenta */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Datos de la cuenta</Text>
        <InfoRow
          icon="card-account-details"
          label="DNI"
          value={user?.dni || '-'}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
        />
        <InfoRow
          icon="email"
          label="Email"
          value={user?.mail || '-'}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
        />
        <InfoRow
          icon="shield-account"
          label="Rol"
          value={rolLabel}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
        />
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

      {/* Sección cobranzas (profesional/admin) */}
      {canVerCobranzas && (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              {isSocioUser ? 'Mis pagos' : 'Cobranzas'}
            </Text>
            {loadingPagos && <ActivityIndicator size="small" color={palette.primary} />}
          </View>

          {/* Resumen del mes */}
          {resumen && (
            <View style={[styles.resumenMes, { backgroundColor: `${palette.success}12`, borderColor: `${palette.success}30` }]}>
              <View style={styles.resumenItem}>
                <Text style={[styles.resumenLabel, { color: textSecondary }]}>
                  {isSocioUser ? 'Pagado este mes' : 'Cobrado este mes'}
                </Text>
                <Text style={[styles.resumenValue, { color: palette.success }]}>
                  {formatCurrency(resumen.total_cobrado ?? 0)}
                </Text>
              </View>
              {resumen.cantidad_pagos != null && (
                <View style={styles.resumenItem}>
                  <Text style={[styles.resumenLabel, { color: textSecondary }]}>Movimientos</Text>
                  <Text style={[styles.resumenValue, { color: textPrimary }]}>
                    {resumen.cantidad_pagos}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Historial de pagos */}
          {pagos.length === 0 && !loadingPagos ? (
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No hay movimientos registrados
            </Text>
          ) : (
            pagos.slice(0, 8).map((pago, i) => {
              const esUltimo = i === Math.min(pagos.length, 8) - 1;
              return (
                <View
                  key={pago.id}
                  style={[
                    styles.pagoRow,
                    !esUltimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
                  ]}
                >
                  <View style={[styles.pagoIcon, { backgroundColor: `${palette.success}15` }]}>
                    <MaterialCommunityIcons name="cash" size={16} color={palette.success} />
                  </View>
                  <View style={styles.pagoInfo}>
                    <Text style={[styles.pagoSocio, { color: textPrimary }]} numberOfLines={1}>
                      {isSocioUser
                        ? pago.profesional
                          ? `${pago.profesional.nombre ?? ''} ${pago.profesional.apellido ?? ''}`.trim()
                          : 'Pago'
                        : pago.socio
                        ? `${pago.socio.nombre ?? ''} ${pago.socio.apellido ?? ''}`.trim()
                        : 'Socio'}
                    </Text>
                    <Text style={[styles.pagoMedio, { color: textSecondary }]}>
                      {MEDIO_PAGO_LABELS[pago.medio_pago] ?? pago.medio_pago}
                      {pago.nota ? ` · ${pago.nota}` : ''}
                    </Text>
                    <Text style={[styles.pagoFecha, { color: textSecondary }]}>
                      {formatDate(pago.fecha_pago)}
                    </Text>
                  </View>
                  <Text style={[styles.pagoMonto, { color: palette.success }]}>
                    {formatCurrency(pago.monto)}
                  </Text>
                </View>
              );
            })
          )}
        </Card>
      )}

      {/* Apariencia */}
      <Card style={styles.section}>
        <AppearanceSettings
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          borderColor={borderColor}
        />
      </Card>

      {/* Permisos */}
      {permisos.length > 0 && (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Permisos ({permisos.length})
          </Text>
          <View style={styles.permisosGrid}>
            {permisos.slice(0, 12).map((permiso) => (
              <View
                key={permiso}
                style={[styles.permisoChip, { backgroundColor: `${palette.info}15` }]}
              >
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

      {/* Información */}
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
        FAP · Guía FA — Funcional Atlético Personalizado
      </Text>
    </ScrollView>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  profileName: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  profileLegalName: { fontSize: 14, marginTop: 4 },
  profileEmail: { fontSize: 14, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: {
    fontSize: 14, fontWeight: '600',
    maxWidth: '55%', textAlign: 'right',
  },
  themeOptions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  themeOption: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, gap: 6,
  },
  themeOptionText: { fontSize: 12, fontWeight: '600' },
  permisosGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginTop: 8, alignItems: 'center',
  },
  permisoChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  permisoText: { fontSize: 12, fontWeight: '600' },
  morePermisos: { fontSize: 12, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.error, paddingVertical: 15, borderRadius: 16,
    gap: 8, marginTop: 8,
  },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  // Cobranzas
  resumenMes: {
    flexDirection: 'row', borderRadius: 12,
    borderWidth: 1, padding: 14, marginBottom: 16, gap: 8,
  },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenLabel: { fontSize: 12, textAlign: 'center' },
  resumenValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  pagoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  pagoIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  pagoInfo: { flex: 1 },
  pagoSocio: { fontSize: 14, fontWeight: '600' },
  pagoMedio: { fontSize: 12, marginTop: 2 },
  pagoFecha: { fontSize: 11, marginTop: 2 },
  pagoMonto: { fontSize: 15, fontWeight: '800' },
});
