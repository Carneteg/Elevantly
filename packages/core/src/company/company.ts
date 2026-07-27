/**
 * Arbetsgivare (företag) — den nya aktören i Jobb & rekrytering (roadmap pelare 6,
 * fas 6b). Ett företag skapas självbetjänat av en inloggad användare, som blir
 * dess första medlem. Flera medlemmar (rekryterare) kan dela ett företag och posta
 * jobb i dess namn. Medlemskap hanteras separat (se `company_members` i migrationerna).
 *
 * Företagsnamnet är fritext (visning), men jobb-KRAVEN uttrycks i den kanoniska
 * taxonomin — så det sociala/arbetsgivarlagret aldrig drar tillbaka matchningen i
 * en nyckelordsdjungel (CLAUDE.md 7.3).
 */
export interface Company {
  /** Stabilt id (sätts av lagret/databasen). */
  id: string;
  /** Företagsnamn (fritext, visning). */
  name: string;
  /** Kort beskrivning (fritext). Valfri. */
  summary?: string;
  /** Användaren som skapade företaget (userId). */
  createdBy: string;
  /** När företaget skapades (ISO 8601). */
  createdAt: string;
}

/** Övre gränser — dataminimering och skydd mot missbruk. */
export const MAX_COMPANY_NAME = 100;
export const MAX_COMPANY_SUMMARY = 500;

/** Trimmat företagsnamn. */
export function normalizeCompanyName(name: string): string {
  return name.trim();
}

/** Trimmad, kapad beskrivning (eller `undefined` om tom). */
export function normalizeCompanySummary(summary: string | undefined): string | undefined {
  const trimmed = summary?.trim().slice(0, MAX_COMPANY_SUMMARY);
  return trimmed ? trimmed : undefined;
}

/** Är namnet giltigt (icke-tomt, inom längdgränsen) efter normalisering? */
export function isValidCompanyName(name: string): boolean {
  const normalized = normalizeCompanyName(name);
  return normalized.length > 0 && normalized.length <= MAX_COMPANY_NAME;
}
