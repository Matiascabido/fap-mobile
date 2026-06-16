import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlanWithRelations } from '../../types/planes.types';
import { useAppTheme } from '../../context/ThemeContext';
import { blockColorsFromPlan, toMatteAccent } from '../../utils/planBlockColors';
import { hapticSelection } from '../../utils/haptics';
import { palette } from '../../constants/colors';

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

function PlanListCard({ item, onPress }: PlanListCardProps) {
  const { colors, isDark } = useAppTheme();
  const plan = item.plan;
  const stripeColors = useMemo(() => blockColorsFromPlan(item.bloques ?? []), [item.bloques]);
  const accent = stripeColors[0] ?? toMatteAccent(palette.primary);
  const isActive = item.activo ?? item.asignaciones?.some((a) => a.activo) ?? false;
  const numBloques = item.bloques?.length ?? 0;
  const tipo = plan.tipo_plan?.nombre_tipo?.trim() || 'S.D.';
  const asignacion = asignacionLabel(item);
  const freq =
    plan.numero != null && String(plan.numero).trim() !== '' ? String(plan.numero).trim() : null;

  const chips = useMemo(() => {
    const list: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
      { icon: 'options-outline', text: tipo },
      {
        icon: 'grid-outline',
        text:
          numBloques === 0
            ? 'Sin bloques'
            : `${numBloques} bloque${numBloques === 1 ? '' : 's'}`,
      },
    ];
    if (freq) list.unshift({ icon: 'calendar-outline', text: `${freq}× / sem` });
    return list;
  }, [tipo, numBloques, freq]);

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
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 8,
            },
            android: { elevation: 2 },
          }),
        },
        pressed && { opacity: 0.94, transform: [{ scale: 0.992 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ver plan ${plan.nombre_plan}`}
    >
      <View style={[styles.headerBand, { backgroundColor: accent }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="barbell" size={18} color={accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Plan de entrenamiento</Text>
            <Text style={styles.planName} numberOfLines={2}>
              {plan.nombre_plan}
            </Text>
          </View>
          {isActive ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>Activo</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.objetivo, { color: colors.label }]} numberOfLines={2}>
          {plan.objetivo_semanal?.trim() || 'Sin objetivo semanal definido'}
        </Text>

        <View style={styles.chipsRow}>
          {chips.map((chip) => (
            <View
              key={chip.text}
              style={[
                styles.chip,
                { backgroundColor: `${accent}18`, borderColor: `${accent}35` },
              ]}
            >
              <Ionicons name={chip.icon} size={13} color={accent} />
              <Text style={[styles.chipText, { color: colors.label }]}>{chip.text}</Text>
            </View>
          ))}
        </View>

        {asignacion ? (
          <View style={[styles.assignRow, { backgroundColor: colors.tertiaryGroupedBackground }]}>
            <Ionicons name="person-circle-outline" size={18} color={colors.secondaryLabel} />
            <View style={styles.assignText}>
              <Text style={[styles.assignLabel, { color: colors.secondaryLabel }]}>
                {asignacion.label}
              </Text>
              <Text style={[styles.assignValue, { color: colors.label }]} numberOfLines={1}>
                {asignacion.value}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.footer, { borderTopColor: colors.separator }]}>
          <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>Ver detalle del plan</Text>
          <Ionicons name="arrow-forward-circle" size={20} color={colors.tertiaryLabel} />
        </View>
      </View>
    </Pressable>
  );
}

export default memo(PlanListCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerBand: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(167, 243, 208, 0.95)',
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: {
    padding: 16,
    gap: 12,
  },
  objetivo: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  assignText: { flex: 1, minWidth: 0 },
  assignLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  assignValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
