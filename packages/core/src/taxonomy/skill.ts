import { normalizeText, tokenize } from "../opportunities/role";

/**
 * Kanonisk skill-/rolltaxonomi — anti-djungel-motorn för Jobb & rekrytering
 * (roadmap pelare 6). LinkedIns sök är en djungel för att samma kompetens har
 * många synonymer och titelvarianter i fritext. Vi vänder på det: ETT kanoniskt
 * begrepp per kompetens, och alla varianter viks in till det. Både jobb och
 * kandidater beskrivs i dessa begrepp, så matchning sker på struktur (id), inte
 * på nyckelord (CLAUDE.md 7.3/8.5).
 *
 * Källan är utbytbar (CLAUDE.md 8.4, se `SkillTaxonomy`): v1 är en kurerad katalog
 * i repot; en extern taxonomi (ESCO/SSYK) kan ersätta den utan att röra logiken.
 */

/** Ett kanoniskt kompetensbegrepp med sina synonymer/titelvarianter. */
export interface CanonicalSkill {
  /** Stabilt kanoniskt id (t.ex. "frontend-utveckling"). */
  id: string;
  /** Kanoniskt visningsnamn. */
  label: string;
  /** Alternativa termer och titlar som viks in till samma begrepp. */
  synonyms: string[];
}

/**
 * Kanoniserar en fri term till ett begrepp — hjärtat i anti-djungeln. Rent och
 * deterministiskt (CLAUDE.md 8.5). Först exakt (normaliserad) matchning mot
 * `label`/synonymer; annars token-överlapp mot begreppens ord (fångar varianter
 * som inte listats explicit). `null` om inget begrepp känns igen. Muterar inte indata.
 */
export function canonicalizeTerm(
  term: string,
  skills: CanonicalSkill[],
): CanonicalSkill | null {
  const normalized = normalizeText(term);
  if (!normalized) return null;

  // 1. Exakt matchning på kanoniskt namn eller en synonym.
  for (const skill of skills) {
    if (normalizeText(skill.label) === normalized) return skill;
    for (const synonym of skill.synonyms) {
      if (normalizeText(synonym) === normalized) return skill;
    }
  }

  // 2. Token-överlapp: begreppet som delar flest meningsbärande ord med termen.
  const termTokens = new Set(tokenize(term));
  if (termTokens.size === 0) return null;

  let best: CanonicalSkill | null = null;
  let bestOverlap = 0;
  for (const skill of skills) {
    const skillTokens = new Set(
      [skill.label, ...skill.synonyms].flatMap((value) => tokenize(value)),
    );
    let overlap = 0;
    for (const token of termTokens) {
      if (skillTokens.has(token)) overlap++;
    }
    if (overlap > bestOverlap) {
      best = skill;
      bestOverlap = overlap;
    }
  }
  return best;
}
