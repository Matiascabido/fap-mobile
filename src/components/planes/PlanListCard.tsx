import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PlanWithRelations } from '../../types/planes.types';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import { blockColorsFromPlan } from '../../utils/planBlockColors';
import { hapticSelection } from '../../utils/haptics';

interface PlanListCardProps {
  item: PlanWithRelations;
  onPress: () => void;
}

function asignacionLabel(item: PlanWithRelations): { label: string; value: string } | null {
  const a = item.asignaciones?.[0];
  if (!a) return null;
  const socio =
    a.nombre_socio?.trim() ||
    [a.socio?.nombre, a.socio?.apellido].filter(Boolean).join(' ').trim();
  if (socio) return { label: 'Entrenado', value: socio };
  const prof =
    a.nombre_profesional?.trim() ||
    [a.profesional?.nombre, a.profesional?.apellido].filter(Boolean).join(' ').trim();
  if (prof) return { label: 'Profesional', value: prof };
  return null;
}

function MetaRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.metaRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <View style={[styles.metaIcon, { backgroundColor: colors.tertiaryGroupedBackground }]}>
        <Ionicons name={icon} size={15} color={colors.secondaryLabel} />
      </View>
      <View style={styles.metaText}>
        <Text style={[styles.metaLabel, { color: colors.secondaryLabel }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colors.label }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PlanListCard({ item, onPress }: PlanListCardProps) {
  const { colors } = useAppTheme();
  const plan = item.plan;
  const stripeColors = useMemo(() => blockColorsFromPlan(item.bloques ?? []), [item.bloques]);
  const isActive = item.activo ?? item.asignaciones?.some((a) => a.activo) ?? false;
  const numBloques = item.bloques?.length ?? 0;
  const tipo = plan.tipo_plan?.nombre_tipo?.trim() || 'S.D.';
  const asignacion = asignacionLabel(item);
  const freq =
    plan.numero != null && String(plan.numero).trim() !== '' ? String(plan.numero).trim() : null;

  const metaRows = useMemo(() => {
    const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
      {
        icon: 'star-outline',
        label: 'Objetivo',
        value: plan.objetivo_semanal?.trim() || 'Sin definir',
      },
      { icon: 'options-outline', label: 'Tipo', value: tipo },
    ];
    if (asignacion) rows.push({ icon: 'person-outline', label: asignacion.label, value: asignacion.value });
    rows.push({
      icon: 'grid-outline',
      label: 'Bloques',
      value:
        numBloques === 0
          ? 'Aún sin bloques'
          : `${numBloques} bloque${numBloques === 1 ? '' : 's'} configurado${numBloques === 1 ? '' : 's'}`,
    });
    return rows;
  }, [plan.objetivo_semanal, tipo, asignacion, numBloques]);

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
              shadowOpacity: colors.label === '#FFFFFF' ? 0.35 : 0.06,
              shadowRadius: 6,
            },
            android: { elevation: 1 },
          }),
        },
        pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ver plan ${plan.nombre_plan}`}
    >
      <View style={styles.cardInner}>
        <LinearGradient
          colors={
            (stripeColors.length === 1
              ? [stripeColors[0], stripeColors[0]]
              : stripeColors) as [string, string, ...string[]]
          }
          style={styles.stripe}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.eyebrow, { color: colors.secondaryLabel }]}>
                Plan de entrenamiento
              </Text>
              <View style={styles.nameRow}>
                <Text style={[styles.planName, typography.headline, { color: colors.label }]} numberOfLines={2}>
                  {plan.nombre_plan}
                </Text>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Activo</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {freq ? (
              <View style={[styles.freqPill, { borderColor: colors.separator, backgroundColor: colors.tertiaryGroupedBackground }]}>
                <Text style={[styles.freqText, { color: colors.secondaryLabel }]}>{freq}× / sem</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.metaBlock, { borderTopColor: colors.separator }]}>
            {metaRows.map((row, index) => (
              <MetaRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
                isLast={index === metaRows.length - 1}
              />
            ))}
          </View>

          <View style={[styles.footer, { backgroundColor: colors.tertiaryGroupedBackground, borderColor: colors.separator }]}>
            <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>Ver detalle del plan</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tint} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(PlanListCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardInner: {
    flexDirection: 'row',
    minHeight: 120,
  },
  stripe: {
    width: 6,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 0,
    paddingLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  planName: {
    flexShrink: 1,
    lineHeight: 22,
  },
  activeBadge: {
    backgroundColor: '#34C75918',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#34C75940',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#248A3D',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  freqPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freqText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metaBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    marginHorizontal: -12,
    marginBottom: 0,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
