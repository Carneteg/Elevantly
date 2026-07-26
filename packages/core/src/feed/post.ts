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
