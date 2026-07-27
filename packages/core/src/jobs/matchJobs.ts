import type { Confidence, Decision } from "../decision";
import type { CanonicalSkill } from "../taxonomy/skill";
import { CONFIDENCE_WEIGHT, aggregateCandidateSkills } from "../taxonomy/aggregateCandidateSkills";
import type { Job } from "./job";

/**
 * Varför en jobbmatchning håller — spårbart ner till kandidatens egna handlingar
 * (CLAUDE.md 8.3). Bara faktiska matchningar listas; luckor hittas aldrig på.
 */
export interface JobSkillEvidence {
  /** Det kanoniska begreppet som täcktes. */
  skillId: string;
  /** Begreppets visningsnamn. */
  skillLabel: string;
  /** Var kravet obligatoriskt (annars meriterande)? */
  required: boolean;
  /** Kandidatens kompetens (tolkning) som stödde det. */
  userCapability: string;
  /** Högsta konfidens bland stödjande tolkningar. */
  confidence: Confidence;
  /** Handlingar (`Decision.action`) som kompetensen härrör från — förankringen. */
  fromActions: string[];
}

/** Ett jobb som matchar kandidatens grundade data, med förklaring och rankning. */
export interface JobMatch {
  job: Job;
  /** Antal av jobbets OBLIGATORISKA krav som täcktes. */
  requiredMatched: number;
  /** Jobbets totala antal obligatoriska krav. */
  requiredTotal: number;
  /** Antal MERITERANDE krav som täcktes. */
  preferredMatched: number;
  /** Konfidensviktad poäng som driver rankningen (förklarbar, ej svart låda). */
  score: number;
  /** Vad matchningen vilar på. Aldrig tom för ett returnerat jobb. */
  evidence: JobSkillEvidence[];
}

/** Obligatoriska krav väger tyngre än meriterande. */
const REQUIRED_MULTIPLIER = 2;

/**
 * Matchar kandidatens beslut mot jobbannonser — rent, deterministiskt och
 * förklarbart (CLAUDE.md 8.5). ANTI-DJUNGELN: kandidatens kompetenser kanoniseras
 * via taxonomin (`skills`) till samma begrepp som jobbens krav, så matchningen sker
 * på begrepp (id) — inte på nyckelord eller synonymvarianter. Ett jobb returneras
 * bara med minst ett spårbart stöd i kandidatens data (CLAUDE.md 8.3/11). Muterar
 * inte indata.
 *
 * Rankning: konfidensviktad poäng (obligatoriska krav väger tyngre), sedan
 * täckningsgrad av obligatoriska krav, sedan titel (stabilt).
 */
export function matchJobs(
  decisions: Decision[],
  jobs: Job[],
  skills: CanonicalSkill[],
): JobMatch[] {
  // Kandidatens kanoniska kompetenser: skill-id → bästa stödjande tolkning.
  const byId = aggregateCandidateSkills(decisions, skills);

  const labelById = new Map(skills.map((skill) => [skill.id, skill.label]));

  const matches: JobMatch[] = [];
  for (const job of jobs) {
    const evidence: JobSkillEvidence[] = [];
    let score = 0;
    let requiredMatched = 0;
    let preferredMatched = 0;

    const collect = (skillId: string, required: boolean) => {
      const candidate = byId.get(skillId);
      if (!candidate) return;
      if (required) requiredMatched++;
      else preferredMatched++;
      score +=
        CONFIDENCE_WEIGHT[candidate.confidence] * (required ? REQUIRED_MULTIPLIER : 1);
      evidence.push({
        skillId,
        skillLabel: labelById.get(skillId) ?? skillId,
        required,
        userCapability: candidate.userCapability,
        confidence: candidate.confidence,
        fromActions: [...candidate.actions],
      });
    };

    for (const skillId of job.requiredSkillIds) collect(skillId, true);
    for (const skillId of job.preferredSkillIds) collect(skillId, false);

    if (evidence.length > 0) {
      matches.push({
        job,
        requiredMatched,
        requiredTotal: job.requiredSkillIds.length,
        preferredMatched,
        score,
        evidence,
      });
    }
  }

  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.requiredMatched / Math.max(1, b.requiredTotal) -
        a.requiredMatched / Math.max(1, a.requiredTotal) ||
      a.job.title.localeCompare(b.job.title, "sv"),
  );

  return matches;
}
