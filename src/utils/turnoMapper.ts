import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TurnoResponse } from '../types/turnero.types';
import { formatTime, capitalize } from './formatters';

export interface TurnoDetalleVista {
  id: string;
  fecha: string;
  fechaLabel: string;
  horaInicio: string;
  horaFin: string;
  clase: string;
  instructor: string;
  sala: string;
  descripcionNotas: string | null;
  cupo: number;
  inscritos: number;
  inscripto: boolean;
  cancelado: boolean;
  esRecurrente: boolean;
}

function parseSalaInstructorFromDescripcion(
  desc: string | null | undefined
): { sala: string; instructor: string; notas: string | null } {
  if (!desc?.trim()) return { sala: '—', instructor: '—', notas: null };
  let sala = '—';
  let instructor = '—';
  const notasLines: string[] = [];
  for (const line of desc.split('\n')) {
    const sm = line.match(/^Sala:\s*(.+)$/);
    if (sm) {
      sala = sm[1].trim();
      continue;
    }
    const im = line.match(/^Instructor:\s*(.+)$/);
    if (im) {
      instructor = im[1].trim();
      continue;
    }
    notasLines.push(line);
  }
  const notas = notasLines.join('\n').trim() || null;
  return { sala, instructor, notas };
}

export function mapTurnoToDetalle(
  turno: TurnoResponse,
  inscripto: boolean
): TurnoDetalleVista {
  const start = parseISO(turno.fecha_inicio);
  const end = parseISO(turno.fecha_fin);
  const meta = parseSalaInstructorFromDescripcion(turno.descripcion);
  const instructor =
    meta.instructor !== '—'
      ? meta.instructor
      : turno.creador?.nombre_completo?.trim() || '—';

  return {
    id: turno.id_turno,
    fecha: format(start, 'yyyy-MM-dd'),
    fechaLabel: capitalize(format(start, "EEEE d 'de' MMMM yyyy", { locale: es })),
    horaInicio: formatTime(turno.fecha_inicio),
    horaFin: formatTime(turno.fecha_fin),
    clase: turno.titulo || turno.serie?.titulo || 'Clase',
    instructor,
    sala: meta.sala,
    descripcionNotas: meta.notas,
    cupo: turno.cupos_maximos ?? 0,
    inscritos: turno.cantidad_inscriptos ?? 0,
    inscripto,
    cancelado: !!turno.cancelado,
    esRecurrente: !!turno.serie,
  };
}
