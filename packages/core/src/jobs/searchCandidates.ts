import type { Confidence, Decision } from "../decision";
import type { CanonicalSkill } from "../taxonomy/skill";
import { canonicalizeTerm } from "../taxonomy/skill";
import {
  CONFIDENCE_WEIGHT,
  aggregateCandidateSkills,
} from "../taxonomy/aggregateCandidateSkills";

/**
 * Rekryterarsök — den omvända riktningen av `matchJobs`: EN sökt kompetens mot
 * MÅNGA kandidater (roadmap Fas 7, Del 4). Poängen är att hitta människor via
 * BEVISADE beslut, inte via fåfänge-siffror (CLAUDE.md 3/6.5/11). Samma
 * anti-djungel: söktermen och kandidaternas kompetenser kanoniseras till samma
 * begrepp, så matchningen sker på struktur (id) — inte på nyckelord. Rent,
 * deterministiskt och förklarbart (§8.5); muterar inte indata.
 */

/**
 * En kandidat att söka bland. `ref` är en OGENOMSKINLIG, stabil nyckel (t.ex. ett
 * handle) — aldrig ett userId. Kärnan känner inte till auth eller databas.
 */
export interface CandidateInput {
  ref: string;
  decisions: Decision[];
}

/** Varför en kandidat matchar den sökta kompetensen — spårbart ner till handlingar. */
export interface CandidateSkillEvidence {
  /** Det kanoniska begrepp som söktes. */
  skillId: string;
  /** Begreppets visningsnamn. */
  skillLabel: string;
  /** Kandidatens kompetens (tolkning) som stödde det. */
  userCapability: string;
  /** Högsta konfidens bland stödjande tolkningar. */
  confidence: Confidence;
  /** Handlingar (`Decision.action`) som kompetensen härrör från — förankringen. */
  fromActions: string[];
}

/** En kandidat som matchar den sökta kompetensen, med förklaring och rankning. */
export interface CandidateMatch {
  /** Kandidatens ogenomskinliga nyckel (t.ex. handle). */
  ref: string;
  /** Konfidensviktad poäng som driver rankningen (förklarbar, ej svart låda). */
  score: number;
  /** Bästa stödjande konfidens för den sökta kompetensen. */
  confidence: Confidence;
  /** Vad matchningen vilar på. Aldrig tom för en returnerad kandidat. */
  evidence: CandidateSkillEvidence[];
}

/**
 * Rankar kandidater mot EN sökt kompetens. Söktermen kanoniseras precis som
 * kandidaternas egna kompetenser — känns termen inte igen returneras `[]` (vi
 * hittar aldrig på en matchning, CLAUDE.md 8.3/11). En kandidat returneras bara
 * med spårbart stöd i sina egna beslut. Muterar inte indata.
 *
 * Rankning: konfidensviktad poäng (fallande), sedan `ref` (stabilt).
 */
export function searchCandidates(
  candidates: CandidateInput[],
  queryTerm: string,
  skills: CanonicalSkill[],
): CandidateMatch[] {
  const query = canonicalizeTerm(queryTerm, skills);
  if (!query) return [];

  const matches: CandidateMatch[] = [];
  for (const candidate of candidates) {
    const byId = aggregateCandidateSkills(candidate.decisions, skills);
    const hit = byId.get(query.id);
    if (!hit) continue;
    matches.push({
      ref: candidate.ref,
      score: CONFIDENCE_WEIGHT[hit.confidence],
      confidence: hit.confidence,
      evidence: [
        {
          skillId: query.id,
          skillLabel: query.label,
          userCapability: hit.userCapability,
          confidence: hit.confidence,
          fromActions: [...hit.actions],
        },
      ],
    });
  }

  matches.sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref, "sv"));

  return matches;
}
