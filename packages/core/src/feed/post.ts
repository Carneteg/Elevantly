/**
 * Flödet (feed) — det professionella innehållslagret. Ett inlägg är fritext som
 * en användare delar med sitt nätverk. Fritexten visas för användaren men driver
 * inte systemets resonemang (CLAUDE.md 7.3) — den strukturerade kärnan är fortfarande
 * Decision-poster.
 *
 * Ordningen i flödet är ett PRODUKTBESLUT som ska gå att förklara (CLAUDE.md 8.5):
 * v1 är rent kronologisk (nyast först). Ingen doomscroll-optimering, inga mörka
 * mönster (CLAUDE.md 11).
 */

/**
 * En ögonblicksbild av ett av författarens egna bevisade beslut, som ett inlägg
 * kan grundas i. Substans på den sociala ytan (CLAUDE.md 6.5/11): ett grundat
 * inlägg är spårbart till en verklig handling, precis som profilen. Det är en
 * KOPIA (tas vid publicering) — servern validerar att beslutet faktiskt tillhör
 * författaren innan den sätts (CLAUDE.md 8.3: aldrig påhittad grund).
 */
export interface PostGrounding {
  /** Vad författaren gjorde (från beslutet). */
  action: string;
  /** Mätbart utfall om beslutet hade ett. */
  outcome?: string;
}

/** Ett inlägg i flödet. `body` är fritext (markerad som fritext, inte struktur). */
export interface Post {
  /** Stabilt id (sätts av lagret/databasen). */
  id: string;
  /** Författarens userId. */
  authorId: string;
  /** Inläggets fritext. */
  body: string;
  /** När inlägget skapades (ISO 8601). */
  createdAt: string;
  /**
   * Valfri grund: ett av författarens egna beslut som inlägget vilar på. Sätts bara
   * när författaren väljer det, och alltid som en server-validerad ögonblicksbild.
   */
  groundedIn?: PostGrounding;
}

/**
 * Normaliserar en grund: trimmar text och utelämnar ett tomt `outcome`. Returnerar
 * `undefined` om det inte finns någon meningsfull `action` att grunda i.
 */
export function normalizeGrounding(
  grounding: PostGrounding | undefined,
): PostGrounding | undefined {
  if (!grounding) return undefined;
  const action = grounding.action.trim();
  if (!action) return undefined;
  const outcome = grounding.outcome?.trim();
  return outcome ? { action, outcome } : { action };
}

/** Övre gräns på ett inläggs längd — dataminimering och skydd mot missbruk. */
export const MAX_POST_LENGTH = 3000;

/** Trimmad inläggstext. */
export function normalizePostBody(body: string): string {
  return body.trim();
}

/** Är inläggstexten giltig (icke-tom, inom längdgränsen) efter normalisering? */
export function isValidPostBody(body: string): boolean {
  const normalized = normalizePostBody(body);
  return normalized.length > 0 && normalized.length <= MAX_POST_LENGTH;
}

/**
 * Ordnar ett flöde kronologiskt, nyast först. Ren och deterministisk — den
 * förklarbara rankningen i v1 (CLAUDE.md 8.5). Muterar inte indata.
 */
export function orderFeed(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.createdAt < b.createdAt) return 1;
    if (a.createdAt > b.createdAt) return -1;
    return 0;
  });
}
