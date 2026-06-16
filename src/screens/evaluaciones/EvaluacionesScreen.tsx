import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { Socio } from '../../types/socios.types';
import NuevaEvaluacionFlow, {
  type NuevaEvaluacionPrefill,
} from '../../components/evaluaciones/NuevaEvaluacionFlow';
import EvaluacionesHistorial from '../../components/evaluaciones/EvaluacionesHistorial';

type Tab = 'nueva' | 'historial';

export default function EvaluacionesScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canManageEvaluaciones } = usePermissions();

  const esSocio = !canManageEvaluaciones();
  const [tab, setTab] = useState<Tab>(esSocio ? 'historial' : 'nueva');
  const [historialRefresh, setHistorialRefresh] = useState(0);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [refreshingHistorial, setRefreshingHistorial] = useState(false);
  const [nuevaPrefill, setNuevaPrefill] = useState<NuevaEvaluacionPrefill | null>(null);

  const bgColor = useScreenBackground();
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const tabBg = isDark ? palette.darkCard : '#E2E8F0';

  const socioId = esSocio ? user?.id : selectedSocio?.id;

  const handleNuevaMedicion = (prefill: NuevaEvaluacionPrefill) => {
    setNuevaPrefill(prefill);
    setTab('nueva');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        tab === 'historial' ? (
          <RefreshControl
            refreshing={refreshingHistorial}
            onRefresh={() => {
              setRefreshingHistorial(true);
              setHistorialRefresh((n) => n + 1);
              setTimeout(() => setRefreshingHistorial(false), 500);
            }}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        ) : undefined
      }
    >
      {!esSocio ? (
        <View style={[styles.tabBar, { backgroundColor: tabBg }]}>
          {(
            [
              ['nueva', 'Nueva evaluación'],
              ['historial', 'Historial'],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.tabBtn,
                  active && { backgroundColor: isDark ? palette.darkBg : '#FFFFFF' },
                ]}
                onPress={() => setTab(id)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: active ? palette.primary : textSecondary },
                    active && styles.tabBtnTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {tab === 'nueva' && !esSocio ? (
        <NuevaEvaluacionFlow
          prefill={nuevaPrefill}
          onPrefillConsumed={() => setNuevaPrefill(null)}
          selectedSocio={selectedSocio}
          onSelectSocio={setSelectedSocio}
          onRegistroSaved={() => setHistorialRefresh((n) => n + 1)}
        />
      ) : (
        <EvaluacionesHistorial
          esSocio={esSocio}
          socioId={socioId}
          selectedSocio={selectedSocio}
          onSelectSocio={setSelectedSocio}
          onRefreshRequest={historialRefresh}
          onNuevaMedicion={!esSocio ? handleNuevaMedicion : undefined}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabBtnText: { fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { fontWeight: '800' },
});
