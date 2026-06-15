/**
 * Utilidades para abrir links de WhatsApp.
 * Replica whatsappLink.ts del frontend web.
 */

import { Linking } from 'react-native';

/**
 * Formatea un número de teléfono para WhatsApp (remueve espacios y guiones)
 */
function formatWhatsappPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

/**
 * Construye la URL de WhatsApp con mensaje opcional
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const formattedPhone = formatWhatsappPhone(phone);
  const baseUrl = `whatsapp://send?phone=${formattedPhone}`;
  if (message) {
    return `${baseUrl}&text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Construye la URL de WhatsApp web (fallback)
 */
export function buildWhatsAppWebUrl(phone: string, message?: string): string {
  const formattedPhone = formatWhatsappPhone(phone);
  const baseUrl = `https://wa.me/${formattedPhone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Abre WhatsApp con un número y mensaje opcional
 */
export async function openWhatsApp(phone: string, message?: string): Promise<void> {
  const waUrl = buildWhatsAppUrl(phone, message);
  const webUrl = buildWhatsAppWebUrl(phone, message);

  const canOpen = await Linking.canOpenURL(waUrl);
  if (canOpen) {
    await Linking.openURL(waUrl);
  } else {
    await Linking.openURL(webUrl);
  }
}

/**
 * Construye URL de WhatsApp para compartir un plan con PDF
 */
export function buildWhatsAppHrefPlanPdf(
  phone: string,
  planNombre: string,
  pdfUrl: string
): string {
  const message = `Hola! Te comparto tu plan de entrenamiento "${planNombre}": ${pdfUrl}`;
  return buildWhatsAppWebUrl(phone, message);
}
