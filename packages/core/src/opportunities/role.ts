/**
 * Möjligheter (Opportunities) — "Vilka roller passar det jag faktiskt gjort?"
 * (CLAUDE.md 6.1, roadmap fas 5). Vi matchar användarens GRUNDADE data (beslut +
 * kompetenser) mot rollarketyper. Substans, inte titlar: en roll föreslås bara
 * när det finns spårbart stöd i användarens egna beslut (CLAUDE.md 7.2, 8.3).
 *
 * Rollkällan är avsiktligt utbytbar (CLAUDE.md 8.4): v1 är en kurerad katalog i
 * repot; en extern taxonomi (t.ex. ESCO/SSYK) kan kopplas in bakom samma
 * `RoleCatalog`-interface utan att röra matchningslogiken.
 */

/** En rollarketyp: ett professionellt spår som kännetecknas av vissa kärnkompetenser. */
export interface Role {
  /** Stabilt id. */
  id: string;
  /** Rollens namn (visas för användaren). */
  title: string;
  /** En rad om vad rollen innebär. */
  summary: string;
  /**
   * Kärnkompetenser som kännetecknar rollen. Fri men avsiktligt vald text som
   * normaliseras och tokeniseras vid matchning mot användarens kompetenser.
   */
  capabilities: string[];
}

/**
 * Vanliga svenska stoppord som inte bär matchningssignal. Medvetet kort — vi vill
 * hellre matcha brett och förklara tydligt än att tappa en relevant koppling.
 */
const STOPWORDS = new Set([
  "och", "att", "i", "av", "för", "med", "en", "ett", "som", "på", "till",
  "the", "and", "of", "to", "a", "an", "in", "for", "with",
]);

/** Gemener + skalar bort skiljetecken, behåller bokstäver (inkl. å ä ö) och siffror. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bryter ner text till meningsbärande tokens: normaliserar, delar på blanksteg
 * och tar bort stoppord och för korta ord. Deterministiskt — samma indata ger
 * alltid samma tokens (grunden för en förklarbar matchning, CLAUDE.md 8.5).
 */
export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}
