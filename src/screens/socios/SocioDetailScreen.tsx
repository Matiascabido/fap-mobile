import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sociosService } from '../../services/api/socios.service';
import { SocioDetail } from '../../types/socios.types';
import { SociosStackParamList } from '../../navigation/types';
import { isValidUuid } from '../../utils/uuid';
import { useTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';

type SocioDetailRouteProp = RouteProp<SociosStackParamList, 'SocioDetail'>;

export default function SocioDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<SocioDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { hasPermission } = usePermissions();

  const { socioId } = route.params;

  const [socio, setSocio] = useState<SocioDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const bgColor = useScreenBackground();
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  const loadSocio = useCallback(async () => {
    if (socioId === 'new') {
      navigation.replace('SocioForm');
      return;
    }
    if (!isValidUuid(socioId)) {
      setLoading(false);
      Alert.alert('Error', 'El socio seleccionado no tiene un identificador válido.');
      navigation.goBack();
      return;
    }
    try {
      const data = await sociosService.getById(socioId);
      setSocio(data);
    } catch (error) {
      console.error('Error loading socio detail:', error);
    } finally {
      setLoading(false);
    }
  }, [socioId, navigation]);

  useEffect(() => {
    loadSocio();
  }, [loadSocio]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar socio',
      `¿Estás seguro de que querés eliminar a ${socio?.nombre} ${socio?.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await sociosService.delete(socioId);
              Alert.alert('Éxito', 'Socio eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              // El error ya se muestra en el interceptor
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loader fullscreen message="Cargando información..." />;
  }

  if (!socio) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: bgColor }]}>
        <Text style={{ color: textSecondary }}>No se encontró el socio</Text>
      </View>
    );
  }

  const canEdit = hasPermission('usuarios:edit');
  const canDelete = hasPermission('usuarios:delete');

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header con botón volver */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: textPrimary }]}>Detalle del socio</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header del perfil */}
        <View style={styles.profileHeader}>
          <Avatar nombre={socio.nombre} apellido={socio.apellido} size={80} />
          <Text style={[styles.profileName, { color: textPrimary }]}>
            {socio.nombre} {socio.apellido}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={socio.estado ? 'Activo' : 'Inactivo'}
              variant={socio.estado ? 'success' : 'neutral'}
            />
            {socio.rol?.nombre_rol && (
              <Badge label={socio.rol.nombre_rol} variant="info" />
            )}
          </View>
        </View>

        {/* Datos personales */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Datos personales
          </Text>
          <InfoRow label="DNI" value={socio.dni} textPrimary={textPrimary} textSecondary={textSecondary} />
          <InfoRow label="Email" value={socio.mail} textPrimary={textPrimary} textSecondary={textSecondary} />
          <InfoRow label="Celular" value={socio.celular} textPrimary={textPrimary} textSecondary={textSecondary} />
          <InfoRow label="Género" value={socio.genero} textPrimary={textPrimary} textSecondary={textSecondary} />
          <InfoRow
            label="Fecha de nacimiento"
            value={socio.fecha_nacimiento ? formatDate(socio.fecha_nacimiento) : '-'}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
          <InfoRow
            label="Obra social"
            value={socio.obra_social || '-'}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            isLast
          />
        </Card>

        {/* Domicilio */}
        {socio.domicilio && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Domicilio</Text>
            <InfoRow label="Calle" value={socio.domicilio.calle} textPrimary={textPrimary} textSecondary={textSecondary} />
            <InfoRow label="Número" value={socio.domicilio.numero} textPrimary={textPrimary} textSecondary={textSecondary} />
            <InfoRow label="Piso" value={socio.domicilio.piso || '-'} textPrimary={textPrimary} textSecondary={textSecondary} />
            <InfoRow label="Depto" value={socio.domicilio.depto || '-'} textPrimary={textPrimary} textSecondary={textSecondary} isLast />
          </Card>
        )}

        {/* Historia clínica */}
        {socio.historia_clinica && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Historia clínica
            </Text>
            <ClinicalRow
              label="Antecedentes"
              active={socio.historia_clinica.antecedentes}
              desc={socio.historia_clinica.antecedentes_desc}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <ClinicalRow
              label="Cirugías"
              active={socio.historia_clinica.cirugias}
              desc={socio.historia_clinica.cirugias_desc}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <ClinicalRow
              label="Tratamiento"
              active={socio.historia_clinica.tratamiento}
              desc={socio.historia_clinica.tratamiento_desc}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <ClinicalRow
              label="Patología base"
              active={socio.historia_clinica.patologiaBase}
              desc={socio.historia_clinica.patologiaBase_desc}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              isLast
            />
          </Card>
        )}

        {/* Botones de acción */}
        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  textPrimary: string;
  textSecondary: string;
  isLast?: boolean;
}

function InfoRow({ label, value, textPrimary, textSecondary, isLast }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={[styles.infoLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: textPrimary }]} numberOfLines={2}>
        {value || '-'}
      </Text>
    </View>
  );
}

interface ClinicalRowProps {
  label: string;
  active: boolean;
  desc?: string;
  textPrimary: string;
  textSecondary: string;
  isLast?: boolean;
}

function ClinicalRow({ label, active, desc, textPrimary, textSecondary, isLast }: ClinicalRowProps) {
  return (
    <View style={[styles.clinicalRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.clinicalHeader}>
        <Text style={[styles.infoLabel, { color: textSecondary }]}>{label}</Text>
        <MaterialCommunityIcons
          name={active ? 'check-circle' : 'close-circle'}
          size={18}
          color={active ? palette.success : palette.slate400}
        />
      </View>
      {active && desc ? (
        <Text style={[styles.clinicalDesc, { color: textPrimary }]}>{desc}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  clinicalRow: {
    paddingVertical: 10,
  },
  clinicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clinicalDesc: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: palette.error,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
