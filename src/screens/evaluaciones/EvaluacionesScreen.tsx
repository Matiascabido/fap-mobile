import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import {
  EvaluacionRegistroResumen,
  EvaluacionRegistroResponse,
} from '../../types/evaluaciones.types';
import { Socio } from '../../types/socios.types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';
import SocioSelector from '../../components/common/SocioSelector';
import EvolutionChart from '../../components/common/EvolutionChart';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function EvaluacionesScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canManageEvaluaciones } = usePermissions();

  // Socios/entrenados NO gestionan evaluaciones: solo las ven
  const esSocio = !canManageEvaluaciones();

  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [registros, setRegistros] = useState<EvaluacionRegistroResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrueba, setSelectedPrueba] = useState<string | null>(null);
  const [registroDetalle, setRegistroDetalle] = useState<EvaluacionRegistroResponse | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [evolucion, setEvolucion] = useState<{ labels: string[]; data: number[] } | null>(null);

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  // ID del socio a consultar
  const socioId = esSocio ? user?.id : selectedSocio?.id;

  const loadRegistros = useCallback(async () => {
    if (!socioId) return;
    setLoading(true);
    try {
      const data = await evaluacionesService.listRegistros({
        id_usuario_socio: socioId,
        limit: 200,
      });
      setRegistros(data);
    } catch (error) {
      console.error('Error loading registros:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [socioId]);

  useEffect(() => {
    setSelectedPrueba(null);
    setRegistroDetalle(null);
    setEvolucion(null);
    if (socioId) {
      loadRegistros();
    } else {
      setRegistros([]);
    }
  }, [socioId, loadRegistros]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRegistros();
  }, [loadRegistros]);

  // Pruebas únicas (agrupadas)
  const pruebas = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; count: number }>();
    for (const r of registros) {
      const existing = map.get(r.id_prueba);
      if (existing) {
        existing.count++;
      } else {
        map.set(r.id_prueba, {
          id: r.id_prueba,
          nombre: r.nombre_prueba || r.codigo_prueba || 'Prueba',
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [registros]);

  // Registros de la prueba seleccionada
  const registrosPrueba = useMemo(() => {
    if (!selectedPrueba) return [];
    return registros.filter((r) => r.id_prueba === selectedPrueba);
  }, [registros, selectedPrueba]);

  // Cargar evolución al seleccionar una prueba
  const handleSelectPrueba = async (pruebaId: string) => {
    if (selectedPrueba === pruebaId) {
      setSelectedPrueba(null);
      setEvolucion(null);
      return;
    }
    setSelectedPrueba(pruebaId);
    setEvolucion(null);
    setLoadingDetalle(true);

    try {
      const regsPrueba = registros
        .filter((r) => r.id_prueba === pruebaId)
        .slice(0, 12)
        .reverse(); // cronológico ascendente para el gráfico

      // Cargar detalle de cada registro para extraer valor numérico
      const detalles = await Promise.all(
        regsPrueba.map((r) => evaluacionesService.getRegistro(r.id).catch(() => null))
      );

      const labels: string[] = [];
      const data: number[] = [];

      for (let i = 0; i < detalles.length; i++) {
        const det = detalles[i];
        if (!det) continue;
        // Buscar el primer valor numérico
        const numericoValor = det.valores?.find(
          (v) => v.tipo_valor === 'NUMERICO' && v.valor_numerico != null
        );
        if (numericoValor?.valor_numerico) {
          const num = parseFloat(numericoValor.valor_numerico);
          if (!Number.isNaN(num)) {
            labels.push(formatDate(regsPrueba[i].fecha_evaluacion, 'dd/MM'));
            data.push(num);
          }
        }
      }

      if (data.length > 0) {
        setEvolucion({ labels, data });
      }
    } catch (error) {
      console.error('Error loading evolution:', error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleVerDetalle = async (registroId: string) => {
    if (registroDetalle?.id === registroId) {
      setRegistroDetalle(null);
      return;
    }
    setLoadingDetalle(true);
    try {
      const det = await evaluacionesService.getRegistro(registroId);
      setRegistroDetalle(det);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
    >
      {/* Selector de socio (solo para staff) */}
      {!esSocio && (
        <View style={styles.selectorContainer}>
          <Text style={[styles.label, { color: textSecondary }]}>Socio</Text>
          <SocioSelector selected={selectedSocio} onSelect={setSelectedSocio} />
        </View>
      )}

      {!socioId ? (
        <EmptyState
          icon="account-search"
          title="Seleccioná un socio"
          message="Elegí un socio para ver sus evaluaciones"
        />
      ) : loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : registros.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="Sin evaluaciones"
          message="Este socio todavía no tiene evaluaciones registradas"
        />
      ) : (
        <>
          {/* Pruebas */}
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Pruebas evaluadas
          </Text>
          {pruebas.map((prueba) => {
            const isSelected = selectedPrueba === prueba.id;
            return (
              <View key={prueba.id}>
                <TouchableOpacity
                  style={[
                    styles.pruebaCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: isSelected ? palette.primary : borderColor,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPrueba(prueba.id)}
                >
                  <View style={styles.pruebaIcon}>
                    <MaterialCommunityIcons name="chart-line" size={22} color={palette.primary} />
                  </View>
                  <View style={styles.pruebaInfo}>
                    <Text style={[styles.pruebaNombre, { color: textPrimary }]}>
                      {prueba.nombre}
                    </Text>
                    <Text style={[styles.pruebaCount, { color: textSecondary }]}>
                      {prueba.count} {prueba.count === 1 ? 'registro' : 'registros'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={textSecondary}
                  />
                </TouchableOpacity>

                {/* Contenido expandido: gráfico + historial */}
                {isSelected && (
                  <View style={styles.pruebaExpanded}>
                    {loadingDetalle && !evolucion ? (
                      <ActivityIndicator color={palette.primary} style={styles.detailLoader} />
                    ) : null}

                    {evolucion && evolucion.data.length > 0 ? (
                      <EvolutionChart
                        labels={evolucion.labels}
                        data={evolucion.data}
                        title="Evolución"
                      />
                    ) : null}

                    {/* Historial de registros */}
                    {registrosPrueba.map((reg) => {
                      const showDetalle = registroDetalle?.id === reg.id;
                      return (
                        <Card key={reg.id} style={styles.registroCard}>
                          <TouchableOpacity
                            style={styles.registroHeader}
                            onPress={() => handleVerDetalle(reg.id)}
                          >
                            <MaterialCommunityIcons
                              name="calendar-check"
                              size={18}
                              color={palette.primary}
                            />
                            <Text style={[styles.registroFecha, { color: textPrimary }]}>
                              {formatDate(reg.fecha_evaluacion)}
                            </Text>
                            <MaterialCommunityIcons
                              name={showDetalle ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={textSecondary}
                            />
                          </TouchableOpacity>

                          {showDetalle && registroDetalle ? (
                            <View style={[styles.valoresContainer, { borderTopColor: borderColor }]}>
                              {registroDetalle.observaciones ? (
                                <Text style={[styles.observaciones, { color: textSecondary }]}>
                                  {registroDetalle.observaciones}
                                </Text>
                              ) : null}
                              {registroDetalle.valores?.map((valor) => (
                                <View key={valor.id} style={styles.valorRow}>
                                  <Text style={[styles.valorNombre, { color: textSecondary }]}>
                                    {valor.nombre_campo || valor.codigo_campo || 'Campo'}
                                  </Text>
                                  <Text style={[styles.valorValue, { color: textPrimary }]}>
                                    {formatValor(valor)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </Card>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function formatValor(valor: EvaluacionRegistroResponse['valores'][0]): string {
  if (valor.valor_numerico != null) return valor.valor_numerico;
  if (valor.valor_boolean != null) return valor.valor_boolean ? 'Sí' : 'No';
  if (valor.valor_lateralidad != null) return valor.valor_lateralidad;
  if (valor.valor_fecha != null) return valor.valor_fecha;
  if (valor.valor_texto != null) return valor.valor_texto;
  return '-';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  pruebaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  pruebaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pruebaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pruebaNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  pruebaCount: {
    fontSize: 13,
    marginTop: 2,
  },
  pruebaExpanded: {
    marginBottom: 12,
  },
  detailLoader: {
    paddingVertical: 20,
  },
  registroCard: {
    marginBottom: 8,
  },
  registroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registroFecha: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  valoresContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  observaciones: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  valorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  valorNombre: {
    fontSize: 14,
    flex: 1,
  },
  valorValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});
