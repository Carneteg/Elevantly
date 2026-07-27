import type { Confidence, Decision } from "../decision";
import type { CanonicalSkill } from "./skill";
import { canonicalizeTerm } from "./skill";

/**
 * Delad kärna i anti-djungeln: viker en persons beslut till kanoniska
 * kompetensbegrepp (CLAUDE.md 7.3/8.5). Både `matchJobs` (kandidat → jobb) och
 * `searchCandidates` (kompetens → kandidater) bygger på exakt samma aggregering,
 * så de två riktningarna aldrig glider isär. Rent och deterministiskt — muterar
 * inte indata.
 */

/** Konfidens som vikt — driver rankning och "bästa stödjande tolkning". */
export const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** En kanonisk kompetens som en persons beslut faktiskt stödjer. */
export interface AggregatedSkill {
  /** Kandidatens egen term (tolkning) med högst konfidens. */
  userCapability: string;
  /** Högsta konfidens bland stödjande tolkningar. */
  confidence: Confidence;
  /** Handlingar (`Decision.action`) som kompetensen härrör från — förankringen. */
  actions: Set<string>;
}

/**
 * Aggregerar en persons `Decision`-poster till en karta `skill-id → bästa
 * stödjande tolkning`. Kompetenser som inte kanoniseras (okända begrepp) hoppas
 * över — vi hittar aldrig på en matchning (CLAUDE.md 8.3/11).
 */
export function aggregateCandidateSkills(
  decisions: Decision[],
  skills: CanonicalSkill[],
): Map<string, AggregatedSkill> {
  const byId = new Map<string, AggregatedSkill>();
  for (const decision of decisions) {
    for (const capability of decision.capabilities) {
      const skill = canonicalizeTerm(capability.name, skills);
      if (!skill) continue;
      const existing = byId.get(skill.id);
      if (!existing) {
        byId.set(skill.id, {
          userCapability: capability.name,
          confidence: capability.confidence,
          actions: new Set([decision.action]),
        });
      } else {
        existing.actions.add(decision.action);
        if (
          CONFIDENCE_WEIGHT[capability.confidence] >
          CONFIDENCE_WEIGHT[existing.confidence]
        ) {
          existing.confidence = capability.confidence;
          existing.userCapability = capability.name;
        }
      }
    }
  }
  return byId;
}
