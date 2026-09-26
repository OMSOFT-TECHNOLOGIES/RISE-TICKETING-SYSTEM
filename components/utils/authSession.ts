/** JWT expiry helpers and global session-expired callback (no React deps). */

export function getTokenExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, skewMs = 30_000): boolean {
  const exp = getTokenExpiryMs(token);
  if (exp == null) return false;
  return Date.now() >= exp - skewMs;
}

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export function triggerSessionExpired(): void {
  sessionExpiredHandler?.();
}
