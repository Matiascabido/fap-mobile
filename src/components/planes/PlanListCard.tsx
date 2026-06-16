import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlanWithRelations } from '../../types/planes.types';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  planColorPaletteFromBlocks,
  gradientColorsFromBlocks,
} from '../../utils/planBlockColors';
import {
  planAsignacionDisplayFromItem,
  resolvePlanAsignacionViewer,
} from '../../utils/planAsignacionDisplay';
import { hapticSelection } from '../../utils/haptics';
import { palette } from '../../constants/colors';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface PlanListCardProps {
  item: PlanWithRelations;
  onPress: () => void;
}

function PlanListCard({ item, onPress }: PlanListCardProps) {
  const { isDark } = useTheme();
  const { isGodOrAdmin, isProfesionalUser } = usePermissions();
  const viewer = useMemo(
    () => resolvePlanAsignacionViewer(isGodOrAdmin(), isProfesionalUser),
    [isGodOrAdmin, isProfesionalUser]
  );
  const plan = item.plan;
  const { stripeColors } = useMemo(
    () => planColorPaletteFromBlocks(item.bloques ?? []),
    [item.bloques]
  );
  const headerGradient = useMemo(
    () => gradientColorsFromBlocks(stripeColors) as [string, string, ...string[]],
    [stripeColors]
  );
  const isActive = item.activo ?? item.asignaciones?.some((a) => a.activo) ?? false;
  const numBloques = item.bloques?.length ?? 0;
  const tipo = plan.tipo_plan?.nombre_tipo?.trim() || 'S.D.';
  const asignacion = useMemo(
    () => planAsignacionDisplayFromItem(item, viewer),
    [item, viewer]
  );
  const freq =
    plan.numero != null && String(plan.numero).trim() !== '' ? String(plan.numero).trim() : null;
  const objetivo = plan.objetivo_semanal?.trim() || 'Sin objetivo semanal definido';

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
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planIcon}
        >
          <MaterialCommunityIcons name="dumbbell" size={22} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.planNombre, { color: textPrimary }]} numberOfLines={1}>
            {plan.nombre_plan}
          </Text>
          <Text style={[styles.planTipo, { color: textSecondary }]} numberOfLines={1}>
            {tipo}
          </Text>
        </View>
        <Badge label={isActive ? 'Activo' : 'Finalizado'} variant={isActive ? 'success' : 'neutral'} />
      </View>

      <View style={[styles.cardDivider, { backgroundColor: borderColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardBodyItem}>
          <Text style={[styles.bodyLabel, { color: textSecondary }]}>Objetivo</Text>
          <Text style={[styles.bodyValue, { color: textPrimary }]} numberOfLines={2}>
            {objetivo}
          </Text>
        </View>
        <View style={styles.cardBodyItem}>
          <Text style={[styles.bodyLabel, { color: textSecondary }]}>Bloques</Text>
          <Text style={[styles.bodyValue, { color: textPrimary }]}>
            {numBloques === 0
              ? 'Sin bloques'
              : `${numBloques} bloque${numBloques === 1 ? '' : 's'}`}
          </Text>
          {freq ? (
            <Text style={[styles.bodySub, { color: palette.primary }]}>{freq}× / semana</Text>
          ) : null}
        </View>
      </View>

      {asignacion ? (
        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="account" size={14} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]} numberOfLines={1}>
            {asignacion}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default memo(PlanListCard);

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  planNombre: { fontSize: 16, fontWeight: '600' },
  planTipo: { fontSize: 13, marginTop: 2 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardBodyItem: { flex: 1 },
  bodyLabel: { fontSize: 12, textTransform: 'uppercase' },
  bodyValue: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  bodySub: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  footerText: { fontSize: 13, flex: 1 },
});
