import React, { Fragment } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  EvaluacionCampo,
  EvaluacionRegistroResponse,
} from '../../types/evaluaciones.types';
import {
  readBilateralCeldaPartes,
  readEvolucionCelda,
  type EvolucionFila,
} from '../../utils/evaluaciones/evolucionPrueba';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import Badge from '../common/Badge';
import EvaluacionValorPill from './EvaluacionValorPill';

export interface EvaluacionTablaColumna {
  key: string;
  titulo: string;
  subtitulo?: string;
  badge?: string;
  registro: EvaluacionRegistroResponse;
  destacada?: boolean;
}

interface Props {
  filas: EvolucionFila[];
  campos: EvaluacionCampo[];
  columnas: EvaluacionTablaColumna[];
}

const LABEL_WIDTH = 148;
const COL_WIDTH = 112;

function parseNumeric(texto: string): number | null {
  const normalized = texto.replace(',', '.').replace(/[^\d.-]/g, '');
  if (!normalized || normalized === '-' || normalized === '.') return null;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function DeltaBadge({ current, previous }: { current: string; previous: string }) {
  const cur = parseNumeric(current);
  const prev = parseNumeric(previous);
  if (cur == null || prev == null || cur === prev) return null;

  const diff = cur - prev;
  const up = diff > 0;
  const icon = up ? 'arrow-up' : 'arrow-down';
  const color = up ? palette.success : palette.error;
  const sign = up ? '+' : '';

  return (
    <View style={[styles.deltaBadge, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={10} color={color} />
      <Text style={[styles.deltaText, { color }]}>
        {sign}
        {Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)}
      </Text>
    </View>
  );
}

function CeldaValor({
  fila,
  campos,
  registro,
  previousRegistro,
}: {
  fila: EvolucionFila;
  campos: EvaluacionCampo[];
  registro: EvaluacionRegistroResponse;
  previousRegistro?: EvaluacionRegistroResponse;
}) {
  if (fila.kind === 'bilateral') {
    const partes = readBilateralCeldaPartes(fila, campos, registro);
    if (!partes) {
      return <Text style={styles.emptyCell}>—</Text>;
    }

    return (
      <View style={styles.bilateralCell}>
        <View style={styles.bilateralRow}>
          <EvaluacionValorPill compact texto={`D ${partes.der.texto}`} colorKey={partes.der.colorKey} />
          <EvaluacionValorPill compact texto={`I ${partes.izq.texto}`} colorKey={partes.izq.colorKey} />
        </View>
        {partes.lsi ? (
          <EvaluacionValorPill compact texto={`LSI ${partes.lsi.texto}`} colorKey="lsi" />
        ) : null}
      </View>
    );
  }

  const { texto, colorKey } = readEvolucionCelda(fila, campos, registro);
  const prevTexto = previousRegistro
    ? readEvolucionCelda(fila, campos, previousRegistro).texto
    : undefined;

  return (
    <View style={styles.simpleCell}>
      <EvaluacionValorPill compact texto={texto} colorKey={colorKey} />
      {prevTexto && prevTexto !== '—' ? <DeltaBadge current={texto} previous={prevTexto} /> : null}
    </View>
  );
}

export default function EvaluacionDatosTabla({ filas, campos, columnas }: Props) {
  const { isDark } = useTheme();

  if (columnas.length === 0 || filas.length === 0) return null;

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const stickyBg = isDark ? palette.darkCard : '#FFFFFF';
  const headerBg = isDark ? palette.slate800 : palette.slate50;
  const latestBg = isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)';

  return (
    <View style={[styles.wrapper, { borderColor }]}>
      <Text style={[styles.scrollHint, { color: textSecondary, backgroundColor: headerBg }]}>
        Deslizá horizontalmente para comparar sesiones
      </Text>

      <View style={styles.tableRow}>
        <View style={[styles.stickyCol, { backgroundColor: stickyBg, borderRightColor: borderColor }]}>
          <View style={[styles.headerCell, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
            <Text style={[styles.headerLabel, { color: textSecondary }]}>Campo</Text>
          </View>

          {filas.map((fila, idx) => {
            const prevSection = idx > 0 ? filas[idx - 1].section : null;
            const showSection = fila.section && fila.section !== prevSection;

            return (
              <Fragment key={fila.id}>
                {showSection ? (
                  <View style={[styles.sectionRow, { borderBottomColor: borderColor }]}>
                    <Text style={styles.sectionText} numberOfLines={2}>
                      {fila.section}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.labelCell, { borderBottomColor: borderColor }]}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]} numberOfLines={3}>
                    {fila.label}
                  </Text>
                </View>
              </Fragment>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          <View>
            <View style={[styles.dataHeaderRow, { borderBottomColor: borderColor }]}>
              {columnas.map((col) => (
                <View
                  key={col.key}
                  style={[
                    styles.dataHeaderCell,
                    col.destacada && { backgroundColor: latestBg },
                  ]}
                >
                  <Text style={[styles.sessionNum, { color: textPrimary }]}>{col.titulo}</Text>
                  {col.subtitulo ? (
                    <Text style={[styles.sessionDate, { color: textSecondary }]} numberOfLines={2}>
                      {col.subtitulo}
                    </Text>
                  ) : null}
                  {col.badge ? <Badge label={col.badge} variant="success" /> : null}
                </View>
              ))}
            </View>

            {filas.map((fila, idx) => {
              const prevSection = idx > 0 ? filas[idx - 1].section : null;
              const showSection = fila.section && fila.section !== prevSection;

              return (
                <Fragment key={fila.id}>
                  {showSection ? (
                    <View style={[styles.sectionSpacer, { borderBottomColor: borderColor }]} />
                  ) : null}
                  <View style={[styles.dataRow, { borderBottomColor: borderColor }]}>
                    {columnas.map((col, colIdx) => {
                      const previousCol = colIdx > 0 ? columnas[colIdx - 1] : undefined;
                      return (
                        <View
                          key={col.key}
                          style={[
                            styles.dataCell,
                            col.destacada && { backgroundColor: latestBg },
                          ]}
                        >
                          <CeldaValor
                            fila={fila}
                            campos={campos}
                            registro={col.registro}
                            previousRegistro={previousCol?.registro}
                          />
                        </View>
                      );
                    })}
                  </View>
                </Fragment>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  scrollHint: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.slate200,
  },
  tableRow: {
    flexDirection: 'row',
  },
  stickyCol: {
    width: LABEL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  headerCell: {
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionRow: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.primary,
  },
  sectionSpacer: {
    height: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
  labelCell: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  scrollArea: {
    flex: 1,
  },
  dataHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataHeaderCell: {
    width: COL_WIDTH,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 4,
  },
  sessionNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  sessionDate: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataCell: {
    width: COL_WIDTH,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  simpleCell: {
    alignItems: 'center',
    gap: 4,
  },
  bilateralCell: {
    width: '100%',
    gap: 4,
    alignItems: 'stretch',
  },
  bilateralRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyCell: {
    fontSize: 12,
    color: palette.slate400,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
