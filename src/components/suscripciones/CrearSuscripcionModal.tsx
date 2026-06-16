import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserId } from '../../utils/userId';
import { palette } from '../../constants/colors';
import { formatDate, formatCurrency, toIsoDateString } from '../../utils/formatters';
import { matchSearch } from '../../utils/searchNormalize';
import DatePickerField from '../../components/common/DatePickerField';
import Avatar from '../../components/common/Avatar';
import {
  suscripcionesService,
  CreateSuscripcionDTO,
} from '../../services/api/suscripciones.service';
import { suscripcionDetalleService, SuscripcionDetalle } from '../../services/api/suscripcionDetalle.service';
import { sociosService } from '../../services/api/socios.service';
import { Socio } from '../../types/socios.types';
import NuevoPlanSuscripcionModal, {
  NuevoPlanSuscripcionData,
} from './NuevoPlanSuscripcionModal';

function fechaMinimaDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fechaMinima(): string {
  return toIsoDateString(fechaMinimaDate());
}

const STEPS = ['Socio', 'Plan', 'Vencimiento'] as const;
type Step = (typeof STEPS)[number];

interface CrearSuscripcionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  profesionalId?: string;
}

export default function CrearSuscripcionModal({
  visible,
  onClose,
  onCreated,
  profesionalId,
}: CrearSuscripcionModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('Socio');
  const [socios, setSocios] = useState<Socio[]>([]);
  const [detalles, setDetalles] = useState<SuscripcionDetalle[]>([]);
  const [socioSel, setSocioSel] = useState('');
  const [detalleSel, setDetalleSel] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [profId, setProfId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchSocio, setSearchSocio] = useState('');
  const [searchPlan, setSearchPlan] = useState('');
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;
  const sectionBg = isDark ? palette.slate800 : palette.slate50;

  useEffect(() => {
    if (visible) {
      setProfId(profesionalId ?? getUserId(user));
      setLoadingData(true);
      Promise.all([
        sociosService.getSocios().catch(() => []),
        suscripcionDetalleService.getAll().catch(() => []),
      ])
        .then(([s, d]) => {
          setSocios(s);
          setDetalles(d);
        })
        .finally(() => setLoadingData(false));
    }
  }, [visible, profesionalId, user]);

  const reset = () => {
    setStep('Socio');
    setSocioSel('');
    setDetalleSel('');
    setFechaVenc('');
    setSearchSocio('');
    setSearchPlan('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const filteredSocios = useMemo(
    () =>
      searchSocio.trim()
        ? socios.filter(
            (s) =>
              matchSearch(s.nombre, searchSocio) ||
              matchSearch(s.email, searchSocio) ||
              matchSearch(s.dni, searchSocio)
          )
        : socios,
    [socios, searchSocio]
  );

  const filteredDetalles = useMemo(
    () =>
      searchPlan.trim()
        ? detalles.filter((d) => matchSearch(d.nombre, searchPlan))
        : detalles,
    [detalles, searchPlan]
  );

  const socioSelected = socios.find((s) => s.id === socioSel);
  const detalleSelected = detalles.find((d) => d.id === detalleSel);
  const stepIndex = STEPS.indexOf(step);

  const validateStep = (current: Step): boolean => {
    const errs: Record<string, string> = {};
    if (current === 'Socio' && !socioSel) errs.socio = 'Seleccioná un socio';
    if (current === 'Plan' && !detalleSel) errs.detalle = 'Seleccioná un plan';
    if (current === 'Vencimiento') {
      if (!fechaVenc) errs.fecha = 'Elegí la fecha de vencimiento';
      else if (fechaVenc < fechaMinima()) errs.fecha = 'La fecha debe ser al menos mañana';
      if (!profId) errs.prof = 'Falta el profesional asignado';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 'Socio') setStep('Plan');
    else if (step === 'Plan') setStep('Vencimiento');
  };

  const handleBack = () => {
    setErrors({});
    if (step === 'Plan') setStep('Socio');
    else if (step === 'Vencimiento') setStep('Plan');
  };

  const handleCreate = async () => {
    if (!validateStep('Vencimiento')) return;
    setLoading(true);
    const dto: CreateSuscripcionDTO = {
      id_usuario: socioSel,
      id_suscripcion_detalle: detalleSel,
      fecha_vencimiento: fechaVenc,
      id_usuario_profesional: profId,
    };
    try {
      await suscripcionesService.create(dto);
      Alert.alert('Éxito', 'Suscripción creada correctamente.');
      handleClose();
      onCreated();
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewDetalle = useCallback(async (planData: NuevoPlanSuscripcionData) => {
    const raw = await suscripcionDetalleService.create({
      nombre: planData.nombre,
      precio: planData.precio,
    });

    let refreshed = await suscripcionDetalleService.getAll();
    let newId: string | null = raw.id || null;

    if (!newId) {
      const wantedNombre = planData.nombre.trim().toLowerCase();
      const wantedPrecio = String(planData.precio);
      const match = refreshed.find(
        (s) =>
          s.nombre.trim().toLowerCase() === wantedNombre &&
          String(s.precio ?? '') === wantedPrecio
      );
      if (match) newId = match.id;
    }

    if (newId && !refreshed.some((s) => s.id === newId)) {
      refreshed = [
        ...refreshed,
        { id: newId, nombre: raw.nombre || planData.nombre, precio: raw.precio ?? planData.precio },
      ];
    }

    setDetalles(refreshed);
    if (newId) {
      setDetalleSel(newId);
      setErrors((e) => ({ ...e, detalle: '' }));
    }
    setShowNuevoPlan(false);
    Alert.alert('Éxito', 'Plan agregado al catálogo.');
  }, []);

  const renderStepIndicator = () => (
    <View style={styles.stepsRow}>
      {STEPS.map((label, index) => {
        const done = index < stepIndex;
        const active = index === stepIndex;
        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: done || active ? palette.primary : inputBg,
                  borderColor: done || active ? palette.primary : borderColor,
                },
              ]}
            >
              {done ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              ) : (
                <Text style={[styles.stepNum, { color: active ? '#FFF' : textSecondary }]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: active ? palette.primary : textSecondary, fontWeight: active ? '700' : '500' },
              ]}
            >
              {label}
            </Text>
            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: done ? palette.primary : borderColor },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );

  const renderSocioStep = () => (
    <View style={[styles.sectionCard, { backgroundColor: sectionBg, borderColor }]}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>¿A quién suscribís?</Text>
      <Text style={[styles.sectionHint, { color: textSecondary }]}>
        Buscá por nombre, email o DNI
      </Text>
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: bgColor, borderColor: errors.socio ? palette.error : borderColor },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={18} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Buscar socio…"
          placeholderTextColor={textSecondary}
          value={searchSocio}
          onChangeText={setSearchSocio}
        />
      </View>
      {errors.socio ? <Text style={styles.fieldError}>{errors.socio}</Text> : null}

      {socioSelected ? (
        <View style={[styles.selectedChip, { borderColor: palette.primary, backgroundColor: `${palette.primary}10` }]}>
          <Avatar nombre={socioSelected.nombre} size={36} />
          <View style={styles.selectedChipText}>
            <Text style={[styles.selectedChipTitle, { color: textPrimary }]}>{socioSelected.nombre}</Text>
            {socioSelected.email ? (
              <Text style={[styles.selectedChipSub, { color: textSecondary }]}>{socioSelected.email}</Text>
            ) : null}
          </View>
          <MaterialCommunityIcons name="check-circle" size={22} color={palette.primary} />
        </View>
      ) : null}

      <View style={styles.listGap}>
        {filteredSocios.slice(0, 20).map((s) => {
          const selected = socioSel === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.optionRow,
                { borderColor: selected ? palette.primary : borderColor, backgroundColor: bgColor },
                selected && { backgroundColor: `${palette.primary}08` },
              ]}
              onPress={() => {
                setSocioSel(s.id);
                setErrors((e) => ({ ...e, socio: '' }));
              }}
            >
              <Avatar nombre={s.nombre} size={40} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: textPrimary }]}>{s.nombre}</Text>
                {s.dni ? (
                  <Text style={[styles.optionSub, { color: textSecondary }]}>DNI {s.dni}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPlanStep = () => (
    <View style={[styles.sectionCard, { backgroundColor: sectionBg, borderColor }]}>
      <View style={styles.planStepHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Elegí el plan</Text>
          <Text style={[styles.sectionHint, { color: textSecondary }]}>
            Seleccioná un plan del catálogo o creá uno nuevo
          </Text>
        </View>
        <TouchableOpacity
          style={styles.nuevoPlanBtn}
          onPress={() => setShowNuevoPlan(true)}
          accessibilityLabel="Nuevo plan"
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: bgColor, borderColor }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Buscar plan…"
          placeholderTextColor={textSecondary}
          value={searchPlan}
          onChangeText={setSearchPlan}
        />
      </View>
      {errors.detalle ? <Text style={styles.fieldError}>{errors.detalle}</Text> : null}

      <View style={styles.planGrid}>
        {filteredDetalles.map((d) => {
          const selected = detalleSel === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.planCard,
                {
                  borderColor: selected ? palette.primary : borderColor,
                  backgroundColor: bgColor,
                },
                selected && { backgroundColor: `${palette.primary}08` },
              ]}
              onPress={() => {
                setDetalleSel(d.id);
                setErrors((e) => ({ ...e, detalle: '' }));
              }}
            >
              {selected ? (
                <View style={styles.planCheck}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={palette.primary} />
                </View>
              ) : null}
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={22}
                color={selected ? palette.primary : textSecondary}
              />
              <Text style={[styles.planName, { color: textPrimary }]} numberOfLines={2}>
                {d.nombre}
              </Text>
              {d.precio ? (
                <Text style={[styles.planPrice, { color: palette.primary }]}>
                  {formatCurrency(Number(d.precio))}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderVencimientoStep = () => (
    <>
      <View style={[styles.sectionCard, { backgroundColor: sectionBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Fecha de vencimiento</Text>
        <Text style={[styles.sectionHint, { color: textSecondary }]}>
          Debe ser al menos mañana
        </Text>
        <DatePickerField
          label=""
          value={fechaVenc}
          onChange={(v) => {
            setFechaVenc(v);
            setErrors((e) => ({ ...e, fecha: '' }));
          }}
          error={errors.fecha}
          minimumDate={fechaMinimaDate()}
          hint={`Mínimo: ${formatDate(fechaMinima())}`}
          placeholder="Elegí la fecha"
        />
        {errors.prof ? <Text style={styles.fieldError}>{errors.prof}</Text> : null}
      </View>

      {(socioSelected || detalleSelected || fechaVenc) && (
        <View style={[styles.resumen, { backgroundColor: `${palette.success}10`, borderColor: `${palette.success}35` }]}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={palette.success} />
          <View style={styles.resumenBody}>
            <Text style={[styles.resumenTitle, { color: palette.success }]}>Resumen</Text>
            {socioSelected ? (
              <Text style={[styles.resumenLine, { color: textPrimary }]}>
                Socio: {socioSelected.nombre}
              </Text>
            ) : null}
            {detalleSelected ? (
              <Text style={[styles.resumenLine, { color: textPrimary }]}>
                Plan: {detalleSelected.nombre}
                {detalleSelected.precio ? ` · ${formatCurrency(Number(detalleSelected.precio))}` : ''}
              </Text>
            ) : null}
            {fechaVenc ? (
              <Text style={[styles.resumenLine, { color: textPrimary }]}>
                Vence: {formatDate(fechaVenc)}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <MaterialCommunityIcons name="card-plus" size={22} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>Nueva suscripción</Text>
              <Text style={[styles.sheetSubtitle, { color: textSecondary }]}>
                Asigná un plan a un socio
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {renderStepIndicator()}

          {loadingData ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.primary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Cargando…</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {step === 'Socio' && renderSocioStep()}
              {step === 'Plan' && renderPlanStep()}
              {step === 'Vencimiento' && renderVencimientoStep()}
            </ScrollView>
          )}

          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            {step !== 'Socio' ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} disabled={loading}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={textSecondary} />
                <Text style={[styles.backBtnText, { color: textSecondary }]}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.backBtn} onPress={handleClose} disabled={loading}>
                <Text style={[styles.backBtnText, { color: textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            )}

            {step === 'Vencimiento' ? (
              <TouchableOpacity
                style={[styles.primaryBtn, (loading || loadingData) && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={loading || loadingData}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Crear suscripción</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, loadingData && styles.btnDisabled]}
                onPress={handleNext}
                disabled={loadingData}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <NuevoPlanSuscripcionModal
        visible={showNuevoPlan}
        onClose={() => setShowNuevoPlan(false)}
        onSave={handleSaveNewDetalle}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.35)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { fontSize: 13, marginTop: 2 },
  stepsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 11 },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '58%',
    width: '84%',
    height: 2,
    zIndex: -1,
  },
  body: { paddingHorizontal: 20, paddingBottom: 12 },
  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 14 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionHint: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 12,
  },
  selectedChipText: { flex: 1 },
  selectedChipTitle: { fontSize: 15, fontWeight: '700' },
  selectedChipSub: { fontSize: 12, marginTop: 2 },
  listGap: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '600' },
  optionSub: { fontSize: 12, marginTop: 2 },
  planStepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  nuevoPlanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  planCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 100,
    gap: 6,
  },
  planCheck: { position: 'absolute', top: 8, right: 8 },
  planName: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  planPrice: { fontSize: 13, fontWeight: '800' },
  fieldError: { fontSize: 12, color: palette.error, marginBottom: 8 },
  resumen: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  resumenBody: { flex: 1 },
  resumenTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  resumenLine: { fontSize: 14, marginBottom: 2, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
