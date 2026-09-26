/** Next numeric station code, max 6 digits (e.g. 000042). */
export function suggestNextStationCode(existingCodes: string[]): string {
  let max = 0;
  for (const raw of existingCodes) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) continue;
    const n = parseInt(digits.slice(0, 6), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = max + 1;
  if (next > 999999) return '999999';
  return String(next).padStart(6, '0');
}
