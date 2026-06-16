import React, { useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import {
  EvaluacionCampo,
  EvaluacionRegistroResponse,
} from '../../types/evaluaciones.types';
import { normalizeCamposTree } from '../../utils/evaluaciones/campoTree';
import { formatRegistroFechaHora } from '../../utils/evaluaciones/evalDateTime';
import {
  buildEvolucionFilas,
  evalValorColorKey,
  readEvolucionCelda,
} from '../../utils/evaluaciones/evolucionPrueba';
import { formatNumericForDisplay } from '../../utils/evaluaciones/evaluacionValores';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import EvaluacionValorPill from './EvaluacionValorPill';

interface Props {
  registroId: string | null;
  onClose: () => void;
}

function formatValorSimple(valor: EvaluacionRegistroResponse['valores'][0]): string {
  if (valor.valor_numerico != null && valor.valor_numerico !== '') {
    return formatNumericForDisplay(valor.valor_numerico);
  }
  if (valor.valor_boolean != null) return valor.valor_boolean ? 'Sí' : 'No';
  if (valor.valor_lateralidad != null) return valor.valor_lateralidad;
  if (valor.valor_fecha != null) return valor.valor_fecha;
  if (valor.valor_texto != null) return valor.valor_texto;
  return '—';
}

export default function EvaluacionRegistroDetalleModal({ registroId, onClose }: Props) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [registro, setRegistro] = useState<EvaluacionRegistroResponse | null>(null);
  const [campos, setCampos] = useState<EvaluacionCampo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  useEffect(() => {
    if (!registroId) {
      setRegistro(null);
      setCampos([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void evaluacionesService
      .getRegistro(registroId)
      .then(async (data) => {
        if (cancelled) return;
        setRegistro(data);
        try {
          const detalle = await evaluacionesService.getCamposPrueba(data.id_prueba);
          if (!cancelled) {
            setCampos(normalizeCamposTree(detalle.campos ?? []));
          }
        } catch {
          if (!cancelled) setCampos([]);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [registroId]);

  const filas = useMemo(() => buildEvolucionFilas(campos), [campos]);

  if (!registroId) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <LinearGradient
            colors={['#0f172a', '#7f1d1d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>DETALLE DE EVALUACIÓN</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {registro?.nombre_prueba ?? 'Evaluación'}
                </Text>
                {registro ? (
                  <Text style={styles.subtitle}>{formatRegistroFechaHora(registro)}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator size="large" color={palette.primary} style={styles.loader} />
            ) : error ? (
              <View style={[styles.errorBox, { borderColor: palette.error }]}>
                <Text style={{ color: palette.error }}>{error}</Text>
              </View>
            ) : registro ? (
              <>
                {registro.observaciones ? (
                  <View style={[styles.obsBox, { borderColor: palette.warning }]}>
                    <Text style={[styles.obsLabel, { color: palette.warning }]}>Observaciones</Text>
                    <Text style={[styles.obsText, { color: textPrimary }]}>
                      {registro.observaciones}
                    </Text>
                  </View>
                ) : null}

                {campos.length > 0 && filas.length > 0 ? (
                  filas.map((fila) => {
                    const celda = readEvolucionCelda(fila, campos, registro);
                    return (
                      <View
                        key={fila.id}
                        style={[styles.valorRow, { borderBottomColor: borderColor }]}
                      >
                        <View style={styles.valorLabelWrap}>
                          {fila.section && fila.section !== 'General' ? (
                            <Text style={[styles.sectionTag, { color: palette.primary }]}>
                              {fila.section}
                            </Text>
                          ) : null}
                          <Text style={[styles.valorLabel, { color: textPrimary }]}>
                            {fila.label}
                          </Text>
                        </View>
                        <EvaluacionValorPill
                          texto={celda.texto}
                          colorKey={celda.colorKey}
                        />
                      </View>
                    );
                  })
                ) : (
                  (registro.valores ?? []).map((valor) => {
                    const texto = formatValorSimple(valor);
                    return (
                      <View
                        key={valor.id}
                        style={[styles.valorRow, { borderBottomColor: borderColor }]}
                      >
                        <Text style={[styles.valorLabel, { color: textSecondary, flex: 1 }]}>
                          {valor.nombre_campo ?? valor.codigo_campo ?? 'Campo'}
                        </Text>
                        <EvaluacionValorPill
                          texto={texto}
                          colorKey={evalValorColorKey(texto)}
                        />
                      </View>
                    );
                  })
                )}

                {(registro.valores ?? []).length === 0 && filas.length === 0 ? (
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    Sin valores registrados.
                  </Text>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#94A3B8',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  closeBtn: {
    padding: 4,
  },
  body: { flexGrow: 0 },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: { paddingVertical: 40 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  obsBox: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  obsLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  obsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  valorRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  valorLabelWrap: { gap: 2 },
  sectionTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valorLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
});
