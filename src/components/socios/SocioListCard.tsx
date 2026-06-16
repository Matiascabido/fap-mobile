import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Socio } from '../../types/socios.types';
import { useTheme } from '../../context/ThemeContext';
import { hapticSelection } from '../../utils/haptics';
import { palette } from '../../constants/colors';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import Badge from '../common/Badge';

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
  const base = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Socio';
  if (estatus && estatus.toLowerCase() !== tipo?.toLowerCase()) {
    const est = estatus.charAt(0).toUpperCase() + estatus.slice(1);
    return `${base} · ${est}`;
  }
  return base;
}

function SocioListCard({ socio, showDni, onPress, onWhatsApp }: SocioListCardProps) {
  const { isDark } = useTheme();
  const { nombre, apellido } = useMemo(() => splitNombre(socio.nombre), [socio.nombre]);
  const isActivo = socio.estado === 'Activo';
  const tipoLabel = formatTipoLabel(socio);
  const hasTelefono = Boolean(socio.telefono?.trim());
  const email = socio.email?.trim() || '—';
  const telefono = socio.telefono?.trim() || '—';
  const dni = showDni && socio.dni?.trim() ? socio.dni.trim() : '—';
  const especialidad = socio.especialidad?.trim();

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  return (
    <Card
      style={styles.card}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
    >
      <View style={styles.cardHeader}>
        <Avatar nombre={nombre} apellido={apellido} size={44} />
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.socioNombre, { color: textPrimary }]} numberOfLines={1}>
            {socio.nombre}
          </Text>
          <Text style={[styles.socioTipo, { color: textSecondary }]} numberOfLines={1}>
            {tipoLabel}
          </Text>
        </View>
        {hasTelefono ? (
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              onWhatsApp();
            }}
            style={styles.waButton}
            hitSlop={8}
            accessibilityLabel={`WhatsApp con ${socio.nombre}`}
          >
            <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>
        ) : null}
        <Badge
          label={socio.estado}
          variant={isActivo ? 'success' : 'neutral'}
        />
      </View>

      <View style={[styles.cardDivider, { backgroundColor: borderColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardBodyItem}>
          <Text style={[styles.bodyLabel, { color: textSecondary }]}>Correo</Text>
          <Text style={[styles.bodyValue, { color: textPrimary }]} numberOfLines={1}>
            {email}
          </Text>
        </View>
        <View style={styles.cardBodyItem}>
          <Text style={[styles.bodyLabel, { color: textSecondary }]}>Teléfono</Text>
          <Text style={[styles.bodyValue, { color: textPrimary }]} numberOfLines={1}>
            {telefono}
          </Text>
          {showDni && dni !== '—' ? (
            <Text style={[styles.bodySub, { color: textSecondary }]}>DNI {dni}</Text>
          ) : null}
        </View>
      </View>

      {especialidad ? (
        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="arm-flex-outline" size={14} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]} numberOfLines={1}>
            {especialidad}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default memo(SocioListCard);

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  socioNombre: { fontSize: 16, fontWeight: '600' },
  socioTipo: { fontSize: 13, marginTop: 2 },
  waButton: {
    marginRight: 8,
    padding: 4,
  },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardBodyItem: { flex: 1 },
  bodyLabel: { fontSize: 12, textTransform: 'uppercase' },
  bodyValue: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  bodySub: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  footerText: { fontSize: 13, flex: 1 },
});
