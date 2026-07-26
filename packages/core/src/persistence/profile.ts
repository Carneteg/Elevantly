import type { Decision } from "../decision";

/**
 * Persistenslagret — abstraherat bakom ett interface, precis som `AIEngine` och
 * `RateLimiter` (CLAUDE.md 8.4 / 12). En Supabase-implementation kan kopplas in
 * senare utan att röra produktlogiken; tills dess finns en in-memory-variant.
 *
 * Dataprinciper (CLAUDE.md 7 & 9): vi lagrar bara det som tjänar användarfrågan
 * — den strukturerade kärnan (`Decision`-poster) plus lite profiltext som
 * användaren själv väljer att visa. Användaren äger sin data, kan exportera den
 * och radera den (`delete`). Modellen antar aldrig att data är anonym eller
 * tillhör en enda användare — allt är knutet till en `userId`.
 */

/**
 * Profilens synlighet. Default är `private` — att bli offentlig är ett
 * uttryckligt opt-in (CLAUDE.md 9.3). `contacts` läggs till när kontakter finns.
 */
export type ProfileVisibility = "private" | "public";

/**
 * En användares sparade professionella profil: den strukturerade kärnan som
 * Spegeln bygger vidare på mellan besök, plus lite profiltext. Ägs av exakt en
 * `userId`.
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
  /** Synlighet. Default `private`. */
  visibility: ProfileVisibility;
  /** Användarnamn för den delbara länken (/u/handle). Gemener. Valfri tills satt. */
  handle?: string;
  /** Visningsnamn (fritext, användaren väljer). Valfri. */
  displayName?: string;
  /** Kort rad om personen, t.ex. "Produktledare". Valfri. */
  headline?: string;
  /** När profilen först skapades (ISO 8601). */
  createdAt: string;
  /** När profilen senast ändrades (ISO 8601). */
  updatedAt: string;
}

/**
 * Den publika vyn av en profil — bara det som får visas för andra. Ingen
 * `userId`, ingen e-post, inga privata fält. Substansen (besluten) är kärnan.
 */
export interface PublicProfile {
  handle: string;
  displayName: string | null;
  headline: string | null;
  decisions: Decision[];
}

/**
 * Lagring av användarprofiler. Rent gränssnitt — ingen kunskap om HTTP, React
 * eller en specifik databas. Implementationer: `InMemoryProfileRepository` och
 * `SupabaseProfileRepository` (med row-level security så att en användare bara
 * når sina egna rader, och alla når offentliga).
 */
export interface ProfileRepository {
  /** Hämtar den egna profilen för `userId`, eller `null` om ingen finns. */
  load(userId: string): Promise<StoredProfile | null>;
  /** Skapar eller ersätter profilen för `profile.userId`. */
  save(profile: StoredProfile): Promise<void>;
  /** Rätt till radering (GDPR): tar bort all data för `userId`. */
  delete(userId: string): Promise<void>;
  /**
   * Hämtar den publika vyn av en profil via dess handle — endast om profilen är
   * offentlig, annars `null`. Kräver ingen inloggning.
   */
  loadPublicProfileByHandle(handle: string): Promise<PublicProfile | null>;
}
