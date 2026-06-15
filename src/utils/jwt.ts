/**
 * Decodifica el payload de un JWT sin verificar firma (solo lectura de claims).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** true si el token no tiene exp válido o ya venció */
export function isJwtExpired(token: string, leewayMs = 30_000): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return Date.now() >= payload.exp * 1000 - leewayMs;
}
