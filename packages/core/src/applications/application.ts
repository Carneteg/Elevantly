import type { Decision } from "../decision";

/**
 * Ansökan på ett jobb (roadmap pelare 6, fas 6c). Elevantlys twist: den GRUNDADE
 * profilen ÄR ansökan — ingen separat CV. Vi lagrar en SAMTYCKT ögonblicksbild av
 * kandidatens beslut (+ namn/headline) vid ansökningstillfället, så arbetsgivaren
 * ser exakt vad kandidaten sökte med — och aldrig kandidatens (kanske privata)
 * live-profil (CLAUDE.md 9.3: kandidaten styr vad som delas; 8.3: spårbar substans).
 */
export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "accepted"
  | "declined";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "accepted",
  "declined",
];

/** Är värdet en giltig ansökningsstatus? */
export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as string[]).includes(value);
}

/** En ansökan med sin samtyckta ögonblicksbild av kandidatens grundade profil. */
export interface Application {
  /** Stabilt id (sätts av lagret/databasen). */
  id: string;
  /** Jobbet ansökan gäller. */
  jobId: string;
  /** Ägande företag (denormaliserat för åtkomst/visning). */
  companyId: string;
  /** Jobbtitel vid ansökan (ögonblicksbild — så kandidaten ser den även om jobbet stängs). */
  jobTitle?: string;
  /** Företagsnamn vid ansökan (ögonblicksbild). */
  companyName?: string;
  /** Kandidatens userId. */
  candidateId: string;
  /** Kandidatens visningsnamn vid ansökan (ögonblicksbild). Valfri. */
  candidateName?: string;
  /** Kandidatens headline vid ansökan (ögonblicksbild). Valfri. */
  candidateHeadline?: string;
  /** Grundad ögonblicksbild: kandidatens beslut vid ansökan. */
  decisions: Decision[];
  /** Valfritt personligt meddelande till arbetsgivaren (fritext). */
  message?: string;
  /** Var ansökan står. */
  status: ApplicationStatus;
  /** När ansökan skickades (ISO 8601). */
  createdAt: string;
}

/** Indata när en kandidat söker (ögonblicksbilden byggs på servern). */
export interface ApplicationInput {
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateHeadline?: string;
  decisions: Decision[];
  message?: string;
}

/** Övre gräns på ett ansökningsmeddelande — dataminimering. */
export const MAX_APPLICATION_MESSAGE = 2000;

/** Trimmat, kapat meddelande (eller `undefined` om tomt). */
export function normalizeApplicationMessage(
  message: string | undefined,
): string | undefined {
  const trimmed = message?.trim().slice(0, MAX_APPLICATION_MESSAGE);
  return trimmed ? trimmed : undefined;
}
