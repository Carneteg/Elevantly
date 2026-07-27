import type { Confidence, Decision } from "../decision";
import type { Role } from "./role";
import { tokenize } from "./role";

/**
 * Varför en rollmatchning håller — spårbart ner till användarens egna handlingar
 * (CLAUDE.md 8.3). Ingen matchning visas utan minst en sådan här bevisrad.
 */
export interface CapabilityEvidence {
  /** Rollens kärnkompetens som täcktes. */
  roleCapability: string;
  /** Användarens kompetens (tolkning) som stödde den. */
  userCapability: string;
  /** Högsta konfidens bland de stödjande tolkningarna. */
  confidence: Confidence;
  /** Handlingar (`Decision.action`) som kompetensen härrör från — förankringen. */
  fromActions: string[];
}

/** En roll som matchar användarens grundade data, med förklaring och rankning. */
export interface RoleMatch {
  role: Role;
  /** Antal av rollens kärnkompetenser som täcktes. */
  matchedCount: number;
  /** Rollens totala antal kärnkompetenser. */
  totalCount: number;
  /** Konfidensviktad poäng som driver rankningen (förklarbar, ej svart låda). */
  score: number;
  /** Vad matchningen vilar på. Aldrig tom för en returnerad match. */
  evidence: CapabilityEvidence[];
}

/** Konservativ viktning: högre konfidens väger mer, men lågt räknas ändå. */
const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

interface UserCapability {
  name: string;
  tokens: Set<string>;
  confidence: Confidence;
  action: string;
}

/**
 * Matchar användarens beslut mot rollarketyper — rent, deterministiskt och
 * förklarbart (CLAUDE.md 8.5). Signalen är STRUKTUREN (kompetenser knutna till
 * beslut), inte fritext (CLAUDE.md 7.3). En roll returneras BARA om minst en av
 * dess kärnkompetenser har spårbart stöd i användarens data — vi hittar aldrig på
 * en riktning (CLAUDE.md 11). Muterar inte indata.
 *
 * Rankning: konfidensviktad poäng, sedan täckningsgrad, sedan titel (stabilt).
 */
export function matchRoles(decisions: Decision[], roles: Role[]): RoleMatch[] {
  const userCapabilities: UserCapability[] = [];
  for (const decision of decisions) {
    for (const capability of decision.capabilities) {
      const tokens = new Set(tokenize(capability.name));
      if (tokens.size === 0) continue;
      userCapabilities.push({
        name: capability.name,
        tokens,
        confidence: capability.confidence,
        action: decision.action,
      });
    }
  }

  const matches: RoleMatch[] = [];

  for (const role of roles) {
    const evidence: CapabilityEvidence[] = [];
    let score = 0;

    for (const roleCapability of role.capabilities) {
      const tagTokens = tokenize(roleCapability);
      if (tagTokens.length === 0) continue;

      const best = bestSupportingCapability(tagTokens, userCapabilities);
      if (!best) continue;

      evidence.push({
        roleCapability,
        userCapability: best.name,
        confidence: best.confidence,
        fromActions: [best.action],
      });
      score += CONFIDENCE_WEIGHT[best.confidence];
    }

    if (evidence.length > 0) {
      matches.push({
        role,
        matchedCount: evidence.length,
        totalCount: role.capabilities.length,
        score,
        evidence,
      });
    }
  }

  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.matchedCount / b.totalCount - a.matchedCount / a.totalCount ||
      a.role.title.localeCompare(b.role.title, "sv"),
  );

  return matches;
}

/**
 * Den användarkompetens som bäst stödjer en rolltagg: mest token-överlapp, och
 * vid lika överlapp den med högst konfidens. `null` om ingen delar en token.
 */
function bestSupportingCapability(
  tagTokens: string[],
  userCapabilities: UserCapability[],
): UserCapability | null {
  let best: UserCapability | null = null;
  let bestOverlap = 0;

  for (const capability of userCapabilities) {
    let overlap = 0;
    for (const token of tagTokens) {
      if (capability.tokens.has(token)) overlap++;
    }
    if (overlap === 0) continue;

    if (
      overlap > bestOverlap ||
      (overlap === bestOverlap &&
        best !== null &&
        CONFIDENCE_WEIGHT[capability.confidence] > CONFIDENCE_WEIGHT[best.confidence])
    ) {
      best = capability;
      bestOverlap = overlap;
    }
  }

  return best;
}
