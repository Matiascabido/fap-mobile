import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { TurnoDetalleVista } from '../../utils/turnoMapper';
import { turnoSinCupo } from '../../utils/turneroCupo';
import Badge from '../common/Badge';

interface TurnoDetailModalProps {
  visible: boolean;
  turno: TurnoDetalleVista | null;
  canEnroll: boolean;
  canManage: boolean;
  inscripcionEnProceso?: boolean;
  onClose: () => void;
  onToggleSubscription: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TurnoDetailModal({
  visible,
  turno,
  canEnroll,
  canManage,
  inscripcionEnProceso = false,
  onClose,
  onToggleSubscription,
  onEdit,
  onDelete,
}: TurnoDetailModalProps) {
  const { isDark } = useTheme();

  if (!turno) return null;

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const bloqueado = inscripcionEnProceso;
  const sinCupos = turnoSinCupo({
    cupos_maximos: turno.cupo,
    cantidad_inscriptos: turno.inscritos,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: palette.primary }]}>Detalle del turno</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Información completa de la clase
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={bloqueado} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.rowPair}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>FECHA</Text>
                <Text style={[styles.fieldValue, { color: textPrimary }]}>{turno.fechaLabel}</Text>
              </View>
              <View style={[styles.field, styles.fieldRight]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>HORARIO</Text>
                <Text style={[styles.fieldValue, { color: textPrimary }]}>
                  {turno.horaInicio} – {turno.horaFin}
                </Text>
              </View>
            </View>

            <View style={styles.rowPair}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>CLASE</Text>
                <Text style={[styles.fieldValueMd, { color: textPrimary }]}>{turno.clase}</Text>
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>INSTRUCTOR</Text>
                <Text style={[styles.fieldValueMd, { color: textPrimary }]}>{turno.instructor}</Text>
              </View>
            </View>

            <View style={styles.rowPair}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>SALA</Text>
                <Text style={[styles.fieldValueMd, { color: textPrimary }]}>{turno.sala}</Text>
              </View>
              <View style={styles.field}>
                <View style={styles.cupoLabelRow}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>CUPO</Text>
                  {sinCupos && !turno.inscripto ? (
                    <Badge label="Cupo lleno" variant="warning" />
                  ) : null}
                </View>
                <Text style={[styles.fieldValueMd, { color: textPrimary }]}>
                  {turno.inscritos}/{turno.cupo}
                </Text>
              </View>
            </View>

            {turno.descripcionNotas ? (
              <View style={styles.notesBox}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>NOTAS</Text>
                <Text style={[styles.notesText, { color: textPrimary }]}>{turno.descripcionNotas}</Text>
              </View>
            ) : null}

            <View style={styles.badgesRow}>
              {turno.inscripto ? <Badge label="Inscripto" variant="success" /> : null}
              {turno.cancelado ? <Badge label="Cancelado" variant="error" /> : null}
              {turno.esRecurrente ? <Badge label="Recurrente" variant="info" /> : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            {canEnroll && !turno.cancelado ? (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  turno.inscripto ? styles.primaryBtnSuccess : styles.primaryBtnDanger,
                  (bloqueado || (sinCupos && !turno.inscripto)) && styles.btnDisabled,
                ]}
                onPress={() => onToggleSubscription(turno.id)}
                disabled={bloqueado || (sinCupos && !turno.inscripto)}
              >
                {bloqueado ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {turno.inscripto ? 'Desuscribirme' : sinCupos ? 'Sin cupos' : 'Inscribirme'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}

            {canManage ? (
              <View style={styles.manageRow}>
                {onEdit ? (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { backgroundColor: isDark ? palette.slate700 : palette.slate800 }]}
                    onPress={() => onEdit(turno.id)}
                    disabled={bloqueado}
                  >
                    <Text style={styles.secondaryBtnText}>Editar</Text>
                  </TouchableOpacity>
                ) : null}
                {onDelete ? (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, styles.deleteBtn]}
                    onPress={() => onDelete(turno.id)}
                    disabled={bloqueado}
                  >
                    <Text style={styles.secondaryBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.closeFooterBtn, { backgroundColor: isDark ? palette.slate700 : palette.slate200 }]}
              onPress={onClose}
              disabled={bloqueado}
            >
              <Text style={[styles.closeFooterText, { color: textPrimary }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 8 },
  body: { paddingHorizontal: 20, maxHeight: 360 },
  rowPair: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  field: { flex: 1 },
  fieldRight: { alignItems: 'flex-end' },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldValue: { fontSize: 17, fontWeight: '800' },
  fieldValueMd: { fontSize: 15, fontWeight: '700' },
  cupoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notesBox: { marginBottom: 12 },
  notesText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnDanger: { backgroundColor: palette.primary },
  primaryBtnSuccess: { backgroundColor: palette.success },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.55 },
  manageRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteBtn: { backgroundColor: palette.error },
  secondaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  closeFooterBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeFooterText: { fontWeight: '800', fontSize: 15 },
});
