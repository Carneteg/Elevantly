import type { Decision } from "../decision";

/**
 * Persistenslagret — abstraherat bakom ett interface, precis som `AIEngine` och
 * `RateLimiter` (CLAUDE.md 8.4 / 12). En Supabase-implementation kan kopplas in
 * senare utan att röra produktlogiken; tills dess finns en in-memory-variant.
 *
 * Dataprinciper (CLAUDE.md 7 & 9): vi lagrar bara det som tjänar användarfrågan
 * "Får jag tillbaka min profil och kan bygga vidare på den mellan besök?" —
 * alltså den strukturerade kärnan (`Decision`-poster). Användaren äger sin data,
 * kan exportera den (läs profilen) och radera den (`delete`). Modellen antar
 * aldrig att data är anonym eller tillhör en enda användare — allt är knutet
 * till en `userId`.
 */

/**
 * En användares sparade professionella profil: den strukturerade kärnan som
 * Spegeln bygger vidare på mellan besök. Ägs av exakt en `userId`.
 *
 * Vi sparar medvetet INTE AI:ns tolkningar (styrkor/roller) — de härleds färskt
 * ur besluten vid varje spegling, så de aldrig blir inaktuella eller känns mer
 * verifierade än de är. Strukturen driver, inte de genererade texterna.
 */
export interface StoredProfile {
  /** Ägarens id (från autentiseringen). Aldrig tomt. */
  userId: string;
  /** Den strukturerade kärnan — bränslet som ackumuleras över besök. */
  decisions: Decision[];
  /** När profilen först skapades (ISO 8601). */
  createdAt: string;
  /** När profilen senast ändrades (ISO 8601). */
  updatedAt: string;
}

/**
 * Lagring av användarprofiler. Rent gränssnitt — ingen kunskap om HTTP, React
 * eller en specifik databas. Implementationer: `InMemoryProfileRepository` (nu)
 * och en Supabase-backad variant (senare, med row-level security så att en
 * användare bara når sina egna rader).
 */
export interface ProfileRepository {
  /** Hämtar profilen för `userId`, eller `null` om ingen finns. */
  load(userId: string): Promise<StoredProfile | null>;
  /** Skapar eller ersätter profilen för `profile.userId`. */
  save(profile: StoredProfile): Promise<void>;
  /** Rätt till radering (GDPR): tar bort all data för `userId`. */
  delete(userId: string): Promise<void>;
}
