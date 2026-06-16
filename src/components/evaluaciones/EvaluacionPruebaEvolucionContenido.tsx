import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import {
  EvaluacionCampo,
  EvaluacionRegistroResponse,
} from '../../types/evaluaciones.types';
import { normalizeCamposTree } from '../../utils/evaluaciones/campoTree';
import { formatRegistroTimeline } from '../../utils/evaluaciones/evalDateTime';
import {
  buildEvolucionFilas,
  getEvolucionColumnasForPrueba,
} from '../../utils/evaluaciones/evolucionPrueba';
import type { HistorialGrupoEvaluacion } from '../../utils/evaluaciones/registrosTimeline';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import EvaluacionDatosTabla, { type EvaluacionTablaColumna } from './EvaluacionDatosTabla';

interface Props {
  grupo: HistorialGrupoEvaluacion;
  pruebaId: string;
  active: boolean;
}

export default function EvaluacionPruebaEvolucionContenido({ grupo, pruebaId, active }: Props) {
  const { isDark } = useTheme();
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  const columnasResumen = useMemo(
    () => (active ? getEvolucionColumnasForPrueba(grupo, pruebaId) : []),
    [active, grupo, pruebaId]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<EvaluacionCampo[]>([]);
  const [registros, setRegistros] = useState<Map<string, EvaluacionRegistroResponse>>(new Map());

  useEffect(() => {
    if (!active || columnasResumen.length === 0) {
      setCampos([]);
      setRegistros(new Map());
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const detalle = await evaluacionesService.getCamposPrueba(pruebaId);
        if (cancelled) return;
        setCampos(normalizeCamposTree(detalle.campos ?? []));

        const full = await Promise.all(
          columnasResumen.map((c) => evaluacionesService.getRegistro(c.registro.id))
        );
        if (cancelled) return;
        const map = new Map<string, EvaluacionRegistroResponse>();
        for (const r of full) map.set(r.id, r);
        setRegistros(map);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al cargar evolución');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, pruebaId, columnasResumen]);

  const filas = useMemo(() => buildEvolucionFilas(campos), [campos]);

  const columnas: EvaluacionTablaColumna[] = useMemo(() => {
    const out: EvaluacionTablaColumna[] = [];
    for (const col of columnasResumen) {
      const registro = registros.get(col.registro.id);
      if (!registro) continue;
      out.push({
        key: col.registro.id,
        titulo: `${col.numeroSesion}°`,
        subtitulo: formatRegistroTimeline({
          fecha_evaluacion: col.fecha,
          created_date: registro.created_date ?? col.created_date ?? null,
        }),
        badge: col.isLatest ? 'Última' : undefined,
        registro,
        destacada: col.isLatest,
      });
    }
    return out;
  }, [columnasResumen, registros]);

  if (!active) return null;

  if (loading) {
    return <ActivityIndicator color={palette.primary} style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={[styles.errorBox, { borderColor: palette.error }]}>
        <Text style={{ color: palette.error, fontSize: 14 }}>{error}</Text>
      </View>
    );
  }

  if (columnasResumen.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: textSecondary }]}>
        Sin registros para esta prueba.
      </Text>
    );
  }

  return <EvaluacionDatosTabla filas={filas} campos={campos} columnas={columnas} />;
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 24 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 14,
  },
});
