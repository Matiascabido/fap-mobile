import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { listPruebasEvolucionEnGrupo } from '../../utils/evaluaciones/evolucionPrueba';
import type { HistorialGrupoEvaluacion } from '../../utils/evaluaciones/registrosTimeline';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import EvaluacionPruebaEvolucionContenido from './EvaluacionPruebaEvolucionContenido';

interface Props {
  visible: boolean;
  grupo: HistorialGrupoEvaluacion | null;
  onClose: () => void;
}

export default function EvaluacionGrupoEvolucionModal({ visible, grupo, onClose }: Props) {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const pruebas = useMemo(
    () => (grupo ? listPruebasEvolucionEnGrupo(grupo) : []),
    [grupo]
  );

  useEffect(() => {
    if (visible) setExpanded(new Set());
  }, [visible, grupo?.grupoId]);

  const togglePrueba = (pruebaId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pruebaId)) next.delete(pruebaId);
      else next.add(pruebaId);
      return next;
    });
  };

  if (!grupo) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <LinearGradient
            colors={['#0f172a', '#7f1d1d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>EVOLUCIÓN POR PRUEBA</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {grupo.grupoNombre}
                </Text>
                <Text style={styles.subtitle}>
                  {grupo.sesiones.length} sesión{grupo.sesiones.length !== 1 ? 'es' : ''} ·{' '}
                  {pruebas.length} prueba{pruebas.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Expandí cada prueba para comparar sesiones (deslizá horizontalmente la tabla).
            </Text>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {pruebas.length === 0 ? (
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                Sin pruebas registradas en este grupo.
              </Text>
            ) : (
              pruebas.map((prueba) => {
                const isOpen = expanded.has(prueba.pruebaId);
                return (
                  <View
                    key={prueba.pruebaId}
                    style={[styles.pruebaCard, { borderColor, backgroundColor: bgColor }]}
                  >
                    <TouchableOpacity
                      style={styles.pruebaHeader}
                      onPress={() => togglePrueba(prueba.pruebaId)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isOpen ? 'chevron-down' : 'chevron-right'}
                        size={22}
                        color={textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pruebaName, { color: textPrimary }]}>
                          {prueba.nombre}
                        </Text>
                        {prueba.seccionNombre ? (
                          <Text style={[styles.seccionTag, { color: palette.primary }]}>
                            {prueba.seccionNombre}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.sesBadge, { backgroundColor: isDark ? palette.slate800 : palette.slate100 }]}>
                        <Text style={[styles.sesBadgeText, { color: textSecondary }]}>
                          {prueba.sesiones} ses.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isOpen ? (
                      <View style={[styles.pruebaBody, { borderTopColor: borderColor }]}>
                        <EvaluacionPruebaEvolucionContenido
                          grupo={grupo}
                          pruebaId={prueba.pruebaId}
                          active
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
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
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
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
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    lineHeight: 18,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
  },
  pruebaCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pruebaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  pruebaName: {
    fontSize: 15,
    fontWeight: '700',
  },
  seccionTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sesBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pruebaBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
});
