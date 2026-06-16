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
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
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
  const { colors } = useAppTheme();

  if (!turno) return null;

  const bloqueado = inscripcionEnProceso;
  const sinCupos = turnoSinCupo({
    cupos_maximos: turno.cupo,
    cantidad_inscriptos: turno.inscritos,
  });
  const puedeInscribir = canEnroll && !turno.cancelado && (!sinCupos || turno.inscripto);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <View style={[styles.handle, { backgroundColor: colors.fill }]} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.label }]}>{turno.clase}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
                {turno.fechaLabel}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={bloqueado} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={[styles.infoCard, { backgroundColor: colors.tertiaryGroupedBackground }]}>
              <View style={styles.rowPair}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
                    Horario
                  </Text>
                  <Text style={[styles.fieldValue, { color: colors.label }]}>
                    {turno.horaInicio} – {turno.horaFin}
                  </Text>
                </View>
                <View style={[styles.field, styles.fieldRight]}>
                  <Text style={[styles.fieldLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
                    Cupo
                  </Text>
                  <Text style={[styles.fieldValue, { color: colors.label }]}>
                    {turno.inscritos}/{turno.cupo}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.separator }]} />

              <View style={styles.rowPair}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
                    Instructor
                  </Text>
                  <Text style={[styles.fieldValueMd, { color: colors.label }]}>{turno.instructor}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
                    Sala
                  </Text>
                  <Text style={[styles.fieldValueMd, { color: colors.label }]}>{turno.sala}</Text>
                </View>
              </View>
            </View>

            {turno.descripcionNotas ? (
              <View style={[styles.notesBox, { backgroundColor: colors.tertiaryGroupedBackground }]}>
                <Text style={[styles.fieldLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
                  Notas
                </Text>
                <Text style={[styles.notesText, { color: colors.label }]}>{turno.descripcionNotas}</Text>
              </View>
            ) : null}

            <View style={styles.badgesRow}>
              {turno.inscripto ? <Badge label="Inscripto" variant="success" /> : null}
              {sinCupos && !turno.inscripto ? <Badge label="Cupo lleno" variant="warning" /> : null}
              {turno.cancelado ? <Badge label="Cancelado" variant="error" /> : null}
              {turno.esRecurrente ? <Badge label="Recurrente" variant="info" /> : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.separator }]}>
            {puedeInscribir ? (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: turno.inscripto ? palette.success : colors.tint,
                  },
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
                    style={[styles.secondaryBtn, { backgroundColor: colors.tertiaryGroupedBackground }]}
                    onPress={() => onEdit(turno.id)}
                    disabled={bloqueado}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.label }]}>Editar</Text>
                  </TouchableOpacity>
                ) : null}
                {onDelete ? (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, styles.deleteBtn]}
                    onPress={() => onDelete(turno.id)}
                    disabled={bloqueado}
                  >
                    <Text style={[styles.secondaryBtnText, { color: '#FFF' }]}>Eliminar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.closeFooterBtn, { backgroundColor: colors.tertiaryGroupedBackground }]}
              onPress={onClose}
              disabled={bloqueado}
            >
              <Text style={[styles.closeFooterText, { color: colors.label }]}>Cerrar</Text>
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
  body: { paddingHorizontal: 20, maxHeight: 400 },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  rowPair: { flexDirection: 'row', gap: 16 },
  field: { flex: 1 },
  fieldRight: { alignItems: 'flex-end' },
  fieldLabel: { marginBottom: 4 },
  fieldValue: { fontSize: 17, fontWeight: '700' },
  fieldValueMd: { fontSize: 15, fontWeight: '600' },
  notesBox: { borderRadius: 12, padding: 16, marginBottom: 12 },
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
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.55 },
  manageRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 14 },
  deleteBtn: { backgroundColor: palette.error },
  closeFooterBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFooterText: { fontWeight: '700', fontSize: 15 },
});
