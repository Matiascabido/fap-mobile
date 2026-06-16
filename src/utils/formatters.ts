import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseFechaLocal } from './fechasAlertas';

function parseDateInput(dateInput: string | Date): Date | null {
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }
  return parseFechaLocal(dateInput);
}

/** Datetime con componente horario (ISO, offset, etc.) */
function parseDateTimeInput(dateInput: string | Date): Date | null {
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }
  const s = dateInput.trim();
  if (!s) return null;
  try {
    const parsed = parseISO(s);
    if (isValid(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  const native = new Date(s.includes('T') ? s : s.replace(/-/g, '/'));
  return Number.isNaN(native.getTime()) ? null : native;
}

/**
 * Formatea una fecha ISO a formato legible en español
 */
export function formatDate(dateInput: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  try {
    if (dateInput == null) return '-';
    const date = parseDateInput(dateInput);
    if (!date) return '-';
    return format(date, pattern, { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(dateInput: string | Date): string {
  try {
    if (dateInput == null) return '-';
    const date = parseDateTimeInput(dateInput);
    if (!date) return '-';
    return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatea solo la hora
 */
export function formatTime(dateInput: string | Date): string {
  try {
    if (dateInput == null) return '-';
    const date = parseDateTimeInput(dateInput);
    if (!date) return '-';
    return format(date, 'HH:mm', { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatea fecha larga en español (ej: "lunes, 13 de junio de 2026")
 */
export function formatLongDate(dateInput: string | Date): string {
  return formatDate(dateInput, "EEEE, d 'de' MMMM 'de' yyyy");
}

/**
 * Distancia relativa al tiempo actual (ej: "hace 2 días")
 */
export function formatRelativeTime(dateInput: string | Date): string {
  try {
    const date =
      typeof dateInput === 'string'
        ? parseFechaLocal(dateInput) ?? (isValid(parseISO(dateInput)) ? parseISO(dateInput) : null)
        : dateInput;
    if (!date || !isValid(date)) return '-';
    return formatDistanceToNow(date, { locale: es, addSuffix: true });
  } catch {
    return '-';
  }
}

/**
 * Formatea moneda argentina (ARS)
 */
export function formatCurrency(amount: number, currency = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
  try {
    return new Intl.NumberFormat('es-AR').format(num);
  } catch {
    return String(num);
  }
}

/**
 * Formatea un teléfono argentino
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-';
  // Limpiar caracteres no numéricos excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned;
}

/**
 * Obtiene el saludo según la hora del día
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** YYYY-MM-DD para enviar al backend */
export function toIsoDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Parsea YYYY-MM-DD de forma segura */
export function parseIsoDateString(value: string | null | undefined): Date | null {
  return parseFechaLocal(value);
}

/** Hora en formato HH:mm */
export function formatTimeHHmm(date: Date): string {
  return format(date, 'HH:mm');
}

/** Parsea HH:mm a Date (día actual) */
export function parseTimeHHmm(value: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()?.[0] || '';
  const a = apellido?.trim()?.[0] || '';
  return `${n}${a}`.toUpperCase() || '?';
}
