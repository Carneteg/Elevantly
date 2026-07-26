/**
 * Regler för användarnamn (handle) i den delbara profil-länken /u/handle.
 * Rena, deterministiska funktioner — testbara utan databas.
 */

/** Tillåtet format: 3–30 tecken, gemener/siffror/understreck/bindestreck. */
const HANDLE_PATTERN = /^[a-z0-9_-]{3,30}$/;

/** Normaliserar ett handle till lagringsform: trimmat och gemener. */
export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

/** Är handlet giltigt (efter normalisering)? */
export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(normalizeHandle(handle));
}
