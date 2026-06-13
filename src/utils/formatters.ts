import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha ISO a formato legible en español
 */
export function formatDate(dateInput: string | Date, pattern = 'dd/MM/yyyy'): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '-';
    return format(date, pattern, { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(dateInput: string | Date): string {
  return formatDate(dateInput, "dd/MM/yyyy 'a las' HH:mm");
}

/**
 * Formatea solo la hora
 */
export function formatTime(dateInput: string | Date): string {
  return formatDate(dateInput, 'HH:mm');
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
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '-';
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
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()?.[0] || '';
  const a = apellido?.trim()?.[0] || '';
  return `${n}${a}`.toUpperCase() || '?';
}
