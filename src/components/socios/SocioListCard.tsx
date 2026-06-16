import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Socio } from '../../types/socios.types';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import { hapticSelection } from '../../utils/haptics';
import Avatar from '../common/Avatar';

interface SocioListCardProps {
  socio: Socio;
  showDni: boolean;
  onPress: () => void;
  onWhatsApp: () => void;
}

function splitNombre(nombre: string): { nombre: string; apellido: string } {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length <= 1) return { nombre: parts[0] ?? '', apellido: '' };
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
}

function formatTipoLabel(socio: Socio): string {
  const tipo = socio.tipo?.trim();
  const estatus = socio.tipoEstatus?.trim();
  const base = tipo
    ? tipo.charAt(0).toUpperCase() + tipo.slice(1)
    : 'Socio';
  if (estatus && estatus.toLowerCase() !== tipo?.toLowerCase()) {
    const est = estatus.charAt(0).toUpperCase() + estatus.slice(1);
    return `${base} · ${est}`;
  }
  return base;
}

function MetaRow({
  icon,
  label,
  value,
  colors,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.metaRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <View style={[styles.metaIcon, { backgroundColor: colors.tertiaryGroupedBackground }]}>
        <Ionicons name={icon} size={15} color={colors.tint} />
      </View>
      <View style={styles.metaText}>
        <Text style={[styles.metaLabel, { color: colors.secondaryLabel }]}>{label}</Text>
        <Text style={[styles.metaValue, typography.subhead, { color: colors.label }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SocioListCard({ socio, showDni, onPress, onWhatsApp }: SocioListCardProps) {
  const { colors } = useAppTheme();
  const { nombre, apellido } = useMemo(() => splitNombre(socio.nombre), [socio.nombre]);
  const isActivo = socio.estado === 'Activo';
  const tipoLabel = formatTipoLabel(socio);
  const hasTelefono = Boolean(socio.telefono?.trim());

  const metaRows = useMemo(() => {
    const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
    if (socio.email?.trim()) {
      rows.push({ icon: 'mail-outline', label: 'Correo', value: socio.email.trim() });
    }
    if (showDni && socio.dni?.trim()) {
      rows.push({ icon: 'card-outline', label: 'DNI', value: socio.dni.trim() });
    }
    if (hasTelefono) {
      rows.push({ icon: 'call-outline', label: 'Teléfono', value: socio.telefono.trim() });
    }
    if (socio.especialidad?.trim()) {
      rows.push({
        icon: 'fitness-outline',
        label: 'Especialidad',
        value: socio.especialidad.trim(),
      });
    }
    return rows;
  }, [socio, showDni, hasTelefono]);

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.secondaryGroupedBackground,
          borderColor: colors.separator,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkShadow(colors) ? 0.35 : 0.06,
              shadowRadius: 6,
            },
            android: { elevation: 1 },
          }),
        },
        pressed && Platform.OS === 'ios' && { opacity: 0.92, transform: [{ scale: 0.995 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${socio.nombre}`}
    >
      <View style={styles.header}>
        <Avatar nombre={nombre} apellido={apellido} size={52} />

        <View style={styles.headerText}>
          <Text style={[styles.name, typography.headline, { color: colors.label }]} numberOfLines={2}>
            {socio.nombre}
          </Text>
          <View style={styles.badgesRow}>
            <View style={[styles.tipoPill, { backgroundColor: `${colors.tint}14` }]}>
              <Text style={[styles.tipoText, { color: colors.tint }]} numberOfLines={1}>
                {tipoLabel}
              </Text>
            </View>
            <View
              style={[
                styles.estadoPill,
                {
                  backgroundColor: isActivo ? '#34C75918' : colors.fill,
                },
              ]}
            >
              <View
                style={[
                  styles.estadoDot,
                  { backgroundColor: isActivo ? '#34C759' : colors.tertiaryLabel },
                ]}
              />
              <Text
                style={[
                  styles.estadoText,
                  { color: isActivo ? '#248A3D' : colors.secondaryLabel },
                ]}
              >
                {socio.estado}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          {hasTelefono ? (
            <Pressable
              onPress={() => {
                hapticSelection();
                onWhatsApp();
              }}
              style={({ pressed }) => [
                styles.waButton,
                {
                  backgroundColor: '#25D36614',
                  borderColor: '#25D36630',
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`WhatsApp con ${socio.nombre}`}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
            </Pressable>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
        </View>
      </View>

      {metaRows.length > 0 ? (
        <View style={[styles.metaBlock, { borderTopColor: colors.separator }]}>
          {metaRows.map((row, index) => (
            <MetaRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              colors={colors}
              isLast={index === metaRows.length - 1}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyMeta, { borderTopColor: colors.separator }]}>
          <Text style={[styles.emptyMetaText, { color: colors.secondaryLabel }]}>
            Sin datos de contacto registrados
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function isDarkShadow(colors: ReturnType<typeof useAppTheme>['colors']): boolean {
  return colors.label === '#FFFFFF';
}

export default memo(SocioListCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  name: {
    lineHeight: 22,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tipoPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '100%',
  },
  tipoText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  estadoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  waButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  metaIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 15,
  },
  emptyMeta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyMetaText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
