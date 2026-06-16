import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import { formatNetworkErrorMessage } from '../../services/api/http';
import {
  EvaluacionGrupo,
  EvaluacionPruebaDetalle,
  EvaluacionRegistroResponse,
  PruebaEstadoSesion,
} from '../../types/evaluaciones.types';
import { Socio } from '../../types/socios.types';
import { flattenPruebasFromGrupo, type PruebaConSeccion } from '../../utils/evaluaciones/pruebaOrdering';
import { normalizeCamposTree } from '../../utils/evaluaciones/campoTree';
import {
  clearAllEvaluacionCacheForSocio,
  clearDraft,
  clearEvaluacionSessionForGrupo,
  draftStorageKey,
  fechaEvaluacionHoy,
  hydrateEvaluacionStorage,
  readLastGrupoId,
  readSessionState,
  registroTimestamp,
  sessionStorageKey,
  writeSessionState,
} from '../../utils/evaluaciones/registrosTimeline';
import EvaluacionCatalogPicker from './EvaluacionCatalogPicker';
import EvaluacionPruebaForm from './EvaluacionPruebaForm';
import EvaluacionPruebaTabs from './EvaluacionPruebaTabs';
import SocioSelector from '../common/SocioSelector';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import Button from '../common/Button';

export interface NuevaEvaluacionPrefill {
  socioId?: string;
  grupoId?: string;
  pruebaId?: string;
  fecha?: string;
  freshStart?: boolean;
}

interface Props {
  prefill?: NuevaEvaluacionPrefill | null;
  onPrefillConsumed?: () => void;
  selectedSocio?: Socio | null;
  onSelectSocio?: (s: Socio) => void;
  onRegistroSaved?: () => void;
}

export default function NuevaEvaluacionFlow({
  prefill,
  onPrefillConsumed,
  selectedSocio: selectedSocioProp,
  onSelectSocio: onSelectSocioProp,
  onRegistroSaved,
}: Props) {
  const { isDark } = useTheme();
  const [catalogo, setCatalogo] = useState<EvaluacionGrupo[]>([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);
  const [selectedSocioInternal, setSelectedSocioInternal] = useState<Socio | null>(null);
  const selectedSocio = selectedSocioProp ?? selectedSocioInternal;
  const setSelectedSocio = onSelectSocioProp ?? setSelectedSocioInternal;
  const [grupoId, setGrupoId] = useState('');
  const [fechaEvaluacion] = useState(fechaEvaluacionHoy());
  const [activePruebaId, setActivePruebaId] = useState('');
  const [estados, setEstados] = useState<
    Record<string, PruebaEstadoSesion | 'guardada' | 'omitida' | 'pendiente' | 'activa'>
  >({});
  const [observacionesByPrueba, setObservacionesByPrueba] = useState<Record<string, string>>({});
  const [camposCache, setCamposCache] = useState<Map<string, EvaluacionPruebaDetalle>>(new Map());
  const [ultimoByPrueba, setUltimoByPrueba] = useState<Map<string, EvaluacionRegistroResponse>>(
    new Map()
  );
  const [saving, setSaving] = useState(false);
  const [sessionInicioAt, setSessionInicioAt] = useState(() => new Date().toISOString());

  const socioId = selectedSocio?.id ?? '';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const grupo = useMemo(() => catalogo.find((g) => g.id === grupoId) ?? null, [catalogo, grupoId]);
  const pruebas: PruebaConSeccion[] = useMemo(
    () => (grupo ? flattenPruebasFromGrupo(grupo) : []),
    [grupo]
  );

  const sessionKey =
    socioId && fechaEvaluacion && grupoId ? sessionStorageKey(socioId, fechaEvaluacion, grupoId) : '';

  const counts = useMemo(() => {
    let guardadas = 0;
    let omitidas = 0;
    for (const p of pruebas) {
      const e = estados[p.id];
      if (e === 'guardada') guardadas += 1;
      if (e === 'omitida') omitidas += 1;
    }
    return { guardadas, omitidas, total: pruebas.length };
  }, [pruebas, estados]);

  const sesionCompleta =
    counts.total > 0 && counts.guardadas + counts.omitidas >= counts.total;

  useEffect(() => {
    void hydrateEvaluacionStorage();
    void evaluacionesService
      .getCatalogo()
      .then(setCatalogo)
      .catch(() => Alert.alert('Error', 'No se pudo cargar el catálogo de evaluaciones'))
      .finally(() => setCatalogoLoading(false));
  }, []);

  useEffect(() => {
    if (catalogo.length === 0) return;
    const last = readLastGrupoId();
    if (last && catalogo.some((g) => g.id === last)) {
      setGrupoId(last);
    }
  }, [catalogo]);

  useEffect(() => {
    if (!prefill || catalogo.length === 0) return;

    if (prefill.grupoId && catalogo.some((g) => g.id === prefill.grupoId)) {
      if (prefill.freshStart && prefill.socioId && prefill.grupoId) {
        const grupo = catalogo.find((g) => g.id === prefill.grupoId);
        if (grupo) {
          const pruebaIds = flattenPruebasFromGrupo(grupo).map((p) => p.id);
          clearEvaluacionSessionForGrupo(
            prefill.socioId,
            prefill.fecha ?? fechaEvaluacionHoy(),
            prefill.grupoId,
            pruebaIds
          );
        }
      }
      setGrupoId(prefill.grupoId);
    }

    if (prefill.pruebaId) {
      setActivePruebaId(prefill.pruebaId);
    }

    onPrefillConsumed?.();
  }, [prefill, catalogo, onPrefillConsumed]);

  useEffect(() => {
    if (!grupo || pruebas.length === 0) return;

    const saved = sessionKey ? readSessionState(sessionKey) : null;
    const inicioAt = saved?.inicioAt ?? new Date().toISOString();
    setSessionInicioAt(inicioAt);

    const next: Record<string, PruebaEstadoSesion | 'guardada' | 'omitida' | 'pendiente' | 'activa'> =
      {};
    for (const p of pruebas) {
      next[p.id] = saved?.estados?.[p.id] ?? 'pendiente';
    }

    const firstPending =
      pruebas.find((p) => next[p.id] === 'pendiente')?.id ??
      pruebas.find((p) => next[p.id] !== 'guardada' && next[p.id] !== 'omitida')?.id ??
      pruebas[0]?.id ??
      '';

    if (firstPending && next[firstPending] === 'pendiente') {
      next[firstPending] = 'activa';
    }
    setActivePruebaId(firstPending);
    setEstados(next);

    if (sessionKey) {
      writeSessionState(sessionKey, { estados: next, inicioAt });
    }
  }, [grupoId, grupo, pruebas, sessionKey]);

  useEffect(() => {
    if (!socioId || !grupo) return;
    void evaluacionesService
      .listAllRegistros({ id_usuario_socio: socioId })
      .then(async (registros) => {
        const pruebaIds = new Set(pruebas.map((p) => p.id));
        const byPrueba = new Map<string, typeof registros>();
        for (const r of registros) {
          if (!pruebaIds.has(r.id_prueba)) continue;
          const list = byPrueba.get(r.id_prueba) ?? [];
          list.push(r);
          byPrueba.set(r.id_prueba, list);
        }
        const ultimos = new Map<string, EvaluacionRegistroResponse>();
        for (const [pid, list] of byPrueba) {
          const sorted = [...list].sort((a, b) => registroTimestamp(b) - registroTimestamp(a));
          const latest = sorted[0];
          if (latest) {
            try {
              const det = await evaluacionesService.getRegistro(latest.id);
              ultimos.set(pid, det);
            } catch {
              /* ignore */
            }
          }
        }
        setUltimoByPrueba(ultimos);
      })
      .catch(() => setUltimoByPrueba(new Map()));
  }, [socioId, grupo, pruebas]);

  useEffect(() => {
    if (!grupo || pruebas.length === 0) return;
    const prefetch = pruebas.slice(0, 4);
    for (const p of prefetch) {
      if (camposCache.has(p.id)) continue;
      void evaluacionesService.getCamposPrueba(p.id).then((data) => {
        setCamposCache((prev) =>
          new Map(prev).set(p.id, { ...data, campos: normalizeCamposTree(data.campos ?? []) })
        );
      });
    }
  }, [grupoId, pruebas, grupo]);

  const persistEstados = useCallback(
    (next: Record<string, 'pendiente' | 'guardada' | 'omitida' | 'activa'>) => {
      if (!sessionKey) return;
      writeSessionState(sessionKey, { estados: next, inicioAt: sessionInicioAt });
    },
    [sessionKey, sessionInicioAt]
  );

  const setEstadoPrueba = (
    pruebaId: string,
    estado: PruebaEstadoSesion | 'guardada' | 'omitida' | 'pendiente' | 'activa'
  ) => {
    setEstados((prev) => {
      const next = { ...prev, [pruebaId]: estado };
      persistEstados(next);
      return next;
    });
  };

  const selectPrueba = (pruebaId: string) => {
    setEstados((prev) => {
      const next = { ...prev };
      for (const p of pruebas) {
        if (next[p.id] === 'activa') next[p.id] = 'pendiente';
      }
      const prevEstado = next[pruebaId] ?? 'pendiente';
      if (prevEstado !== 'guardada' && prevEstado !== 'omitida') {
        next[pruebaId] = 'activa';
      }
      persistEstados(next);
      return next;
    });
    setActivePruebaId(pruebaId);
  };

  const findNextPending = (afterId?: string): string | null => {
    const idx = afterId ? pruebas.findIndex((p) => p.id === afterId) : -1;
    for (let i = idx + 1; i < pruebas.length; i++) {
      const e = estados[pruebas[i].id];
      if (e !== 'guardada' && e !== 'omitida') return pruebas[i].id;
    }
    for (const p of pruebas) {
      const e = estados[p.id];
      if (e !== 'guardada' && e !== 'omitida' && p.id !== afterId) return p.id;
    }
    return null;
  };

  const handleOmitir = useCallback(
    (pruebaId: string) => {
      clearDraft(draftStorageKey(socioId, fechaEvaluacion, grupoId, pruebaId));
      setEstadoPrueba(pruebaId, 'omitida');
      const next = findNextPending(pruebaId);
      if (next) selectPrueba(next);
    },
    [socioId, fechaEvaluacion, grupoId, estados, pruebas]
  );

  const handleSave = useCallback(
    async (
      pruebaId: string,
      payload: { valores: Parameters<typeof evaluacionesService.createRegistro>[0]['valores']; observaciones: string }
    ) => {
      if (!socioId) {
        Alert.alert('Atención', 'Seleccioná un socio');
        return;
      }
      if (!payload.valores?.length) {
        Alert.alert('Atención', 'Completá al menos un campo de la prueba.');
        return;
      }
      setSaving(true);
      try {
        await evaluacionesService.createRegistro({
          id_prueba: pruebaId,
          id_usuario_socio: socioId,
          fecha_evaluacion: fechaEvaluacion,
          observaciones: payload.observaciones.trim() || null,
          valores: payload.valores,
        });
        clearDraft(draftStorageKey(socioId, fechaEvaluacion, grupoId, pruebaId));
        setEstadoPrueba(pruebaId, 'guardada');
        onRegistroSaved?.();
        const next = findNextPending(pruebaId);
        if (next) selectPrueba(next);
      } catch (e) {
        const raw = e instanceof Error ? e.message : 'Error al guardar';
        Alert.alert('Error', formatNetworkErrorMessage(raw));
      } finally {
        setSaving(false);
      }
    },
    [socioId, fechaEvaluacion, grupoId, onRegistroSaved, estados, pruebas]
  );

  const handleFinalizar = useCallback(() => {
    if (!socioId || !grupoId || pruebas.length === 0) return;

    clearAllEvaluacionCacheForSocio(socioId);
    clearEvaluacionSessionForGrupo(
      socioId,
      fechaEvaluacion,
      grupoId,
      pruebas.map((p) => p.id)
    );

    const inicioAt = new Date().toISOString();
    const firstId = pruebas[0]?.id ?? '';
    const next: Record<string, PruebaEstadoSesion | 'guardada' | 'omitida' | 'pendiente' | 'activa'> =
      {};
    for (const p of pruebas) {
      next[p.id] = p.id === firstId ? 'activa' : 'pendiente';
    }

    setSessionInicioAt(inicioAt);
    setEstados(next);
    setObservacionesByPrueba({});
    setActivePruebaId(firstId);

    if (sessionKey) {
      writeSessionState(sessionKey, { estados: next, inicioAt });
    }

    Alert.alert('Listo', 'Evaluación finalizada. Podés comenzar una nueva tanda con este socio.');
  }, [socioId, grupoId, pruebas, fechaEvaluacion, sessionKey]);

  const activePrueba = pruebas.find((p) => p.id === activePruebaId) ?? null;
  const ready = Boolean(socioId && grupoId && pruebas.length > 0);
  const progressPct =
    counts.total > 0 ? ((counts.guardadas + counts.omitidas) / counts.total) * 100 : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.sessionBar, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.fieldLabel, { color: textSecondary }]}>Socio</Text>
        <SocioSelector selected={selectedSocio} onSelect={setSelectedSocio} />

        <EvaluacionCatalogPicker
          catalogo={catalogo}
          value={grupoId}
          onChange={setGrupoId}
          loading={catalogoLoading}
        />

        <View style={[styles.clockBox, { backgroundColor: isDark ? '#0F172A' : '#1E293B' }]}>
          <Text style={styles.clockLabel}>Momento de la evaluación</Text>
          <Text style={styles.clockDate}>{fechaEvaluacion}</Text>
        </View>

        {ready ? (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: textSecondary }]}>
                Progreso · {counts.guardadas + counts.omitidas}/{counts.total}
              </Text>
              <Text style={[styles.progressDone, { color: palette.success }]}>
                {counts.guardadas} guardadas
                {counts.omitidas > 0 ? ` · ${counts.omitidas} omitidas` : ''}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
              <View
                style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: palette.success }]}
              />
            </View>
            {sesionCompleta ? (
              <View style={[styles.completeBox, { borderColor: `${palette.success}40` }]}>
                <Text style={[styles.completeTitle, { color: palette.success }]}>
                  Evaluación completa
                </Text>
                <Button title="Finalizar evaluación" onPress={handleFinalizar} variant="secondary" />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {!ready ? (
        <View style={[styles.placeholder, { borderColor }]}>
          <Text style={[styles.placeholderText, { color: textSecondary }]}>
            Seleccioná socio y evaluación para comenzar.
          </Text>
        </View>
      ) : (
        <>
          <EvaluacionPruebaTabs
            pruebas={pruebas}
            activeId={activePruebaId}
            estados={estados}
            onSelect={selectPrueba}
          />
          {activePrueba ? (
            <EvaluacionPruebaForm
              key={`${activePrueba.id}-${fechaEvaluacion}`}
              prueba={activePrueba}
              socioId={socioId}
              fechaEvaluacion={fechaEvaluacion}
              grupoId={grupoId}
              camposCache={camposCache}
              onCacheCampos={(id, data) =>
                setCamposCache((prev) => new Map(prev).set(id, data))
              }
              ultimoRegistro={ultimoByPrueba.get(activePrueba.id) ?? null}
              observaciones={observacionesByPrueba[activePrueba.id] ?? ''}
              onObservacionesChange={(v) =>
                setObservacionesByPrueba((prev) => ({ ...prev, [activePrueba.id]: v }))
              }
              onSave={(payload) => handleSave(activePrueba.id, payload)}
              onOmitir={() => handleOmitir(activePrueba.id)}
              saving={saving}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sessionBar: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  clockBox: { borderRadius: 12, padding: 14, marginTop: 8 },
  clockLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  clockDate: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginTop: 6 },
  progressSection: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressDone: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  completeBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    backgroundColor: `${palette.success}08`,
  },
  completeTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  placeholderText: { fontSize: 14, textAlign: 'center' },
});
