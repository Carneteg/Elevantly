import type { Decision } from "../decision";
import { decisionIdentity } from "../decisionIdentity";
import type { StoredProfile } from "./profile";

/**
 * Ackumulera-logiken: hur en användares profil växer mellan besök. Nya beslut
 * läggs till den sparade mängden, utan att samma beslut hamnar två gånger.
 * Ren och deterministisk (tid skickas in) — därför testbar utan databas.
 *
 * Detta är produktlogik (CLAUDE.md 7): den strukturerade kärnan (Decision-poster)
 * är det som ackumuleras och driver identiteten över tid.
 */

/** Övre gräns på antal sparade beslut per profil — skyddar mot obegränsad tillväxt. */
export const MAX_PROFILE_DECISIONS = 500;

/**
 * Slår ihop nya beslut med befintliga: befintliga behålls, nya läggs till sist,
 * och exakta dubbletter (samma handling + källor, se `decisionIdentity`) hoppas
 * över. Om resultatet överstiger `max` behålls de SENASTE (äldsta släpps först).
 */
export function mergeDecisions(
  existing: Decision[],
  incoming: Decision[],
  max: number = MAX_PROFILE_DECISIONS,
): Decision[] {
  const seen = new Set(existing.map(decisionIdentity));
  const result = [...existing];

  for (const decision of incoming) {
    const key = decisionIdentity(decision);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(decision);
  }

  return result.length > max ? result.slice(result.length - max) : result;
}

/**
 * Skapar eller uppdaterar en profil med nya beslut. Saknas profil skapas en ny
 * (med `now` som skapad/ändrad). Finns den behålls `createdAt`, `updatedAt`
 * sätts till `now`, och besluten slås ihop. `now` skickas in för testbarhet.
 */
export function upsertProfile(
  existing: StoredProfile | null,
  userId: string,
  incoming: Decision[],
  now: string,
): StoredProfile {
  if (!userId) throw new Error("userId krävs för att spara en profil.");

  if (!existing) {
    return {
      userId,
      decisions: mergeDecisions([], incoming),
      visibility: "private",
      discoverableByRecruiters: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Bevarar profiltext/synlighet; slår bara ihop besluten och bumpar tiden.
  return {
    ...existing,
    decisions: mergeDecisions(existing.decisions, incoming),
    updatedAt: now,
  };
}
