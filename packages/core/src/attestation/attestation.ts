/**
 * Attestering — nätverket intygar ett beslut (roadmap Fas 7, Del 3). Detta är
 * hur ett självrapporterat påstående blir `attesterat` (bevisgraden `attested`):
 * en KONTAKT skriver under på en specifik prestation, med en kort motivering.
 *
 * Designen är medvetet dyr (CLAUDE.md 6.5 / 11 — substans över fåfänga):
 * - Attestering kräver en **motivering** (inte ett klick) — knappheten ger värdet.
 * - Antalet aktiva attesteringar en person kan ge är **synligt begränsat**.
 * - Bara en accepterad **kontakt** kan attestera (ömsesidig relation krävs).
 * - Profilägaren måste **godkänna** attesteringen innan den visas (samtycke, §9.3):
 *   en attestering börjar som `pending`, blir `accepted` först när ägaren säger ja.
 *
 * Attesteringen pekar på ett beslut via `decisionKey` (se `decisionIdentity`) —
 * systemets stabila, innehållsbaserade identitet, samma som dedupliceringen.
 */

/**
 * En attesterings livscykel.
 * - `pending`  Attesteraren har begärt; väntar på profilägarens godkännande.
 * - `accepted` Ägaren har godkänt. Först nu höjer den bevisgraden och visas.
 * - `declined` Ägaren avböjde, eller attesteraren drog tillbaka. Frigör budget.
 */
export type AttestationStatus = "pending" | "accepted" | "declined";

/** En attestering av ett specifikt beslut hos en användare. Rent id-baserad. */
export interface Attestation {
  /** Stabilt id (från databasen). */
  id: string;
  /** Användaren vars beslut intygas (profilägaren). */
  subjectUserId: string;
  /** Beslutets stabila identitet (se `decisionIdentity`). */
  decisionKey: string;
  /** Kontakten som intygar. */
  attesterUserId: string;
  /** Kort fritextmotivering — obligatorisk, det är det som ger attesteringen tyngd. */
  motivation: string;
  /** Status i livscykeln. */
  status: AttestationStatus;
  /** När attesteringen begärdes (ISO 8601). */
  createdAt: string;
  /** När ägaren avgjorde den (ISO 8601), om avgjord. */
  decidedAt?: string;
}

/** Det en attesterare skickar in för att begära en attestering. */
export interface AttestationInput {
  /** Profilägaren vars beslut intygas. */
  subjectUserId: string;
  /** Beslutets stabila identitet. */
  decisionKey: string;
  /** Motiveringen (valideras). */
  motivation: string;
}

/**
 * Hur många AKTIVA attesteringar (väntande + godkända) en användare får ge totalt.
 * Medvetet lågt — knappheten är designad och gör varje attestering socialt "dyr"
 * och därmed trovärdig (roadmap Del 3). Avböjda/tillbakadragna frigör budget.
 */
export const MAX_ACTIVE_ATTESTATIONS = 10;

/** Motiveringens gränser. Nog för en mening som förklarar HUR man vet — inte ett klick. */
export const MOTIVATION_MIN = 15;
export const MOTIVATION_MAX = 280;

/** Trimmar motiveringen; slår ihop inre whitespace till enkla mellanslag. */
export function normalizeMotivation(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** Är motiveringen giltig efter normalisering (inom längdgränserna)? */
export function isValidMotivation(raw: string): boolean {
  const m = normalizeMotivation(raw);
  return m.length >= MOTIVATION_MIN && m.length <= MOTIVATION_MAX;
}

/** Får en användare ge fler attesteringar givet hur många aktiva hen redan har? */
export function canGiveMore(activeCount: number): boolean {
  return activeCount < MAX_ACTIVE_ATTESTATIONS;
}

/** Hur många attesteringar användaren har kvar att ge (aldrig negativt). */
export function remainingBudget(activeCount: number): number {
  return Math.max(0, MAX_ACTIVE_ATTESTATIONS - activeCount);
}

/**
 * De beslutsnycklar som har minst en GODKÄND attestering — driver bevisgraden.
 * Rent och deterministiskt: `evidenceTier(decision, keys)` blir `attested` för de
 * beslut vars identitet finns här. Ignorerar väntande/avböjda (de visas aldrig
 * som bevis).
 */
export function acceptedDecisionKeys(
  attestations: Attestation[],
): Set<string> {
  const keys = new Set<string>();
  for (const a of attestations) {
    if (a.status === "accepted") keys.add(a.decisionKey);
  }
  return keys;
}
