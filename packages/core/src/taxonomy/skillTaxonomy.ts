import type { CanonicalSkill } from "./skill";

/**
 * Källan till kanoniska kompetensbegrepp — abstraherad bakom ett interface precis
 * som `RoleCatalog` (CLAUDE.md 8.4). Produktlogiken (jobb-matchning, sök) beror bara
 * på detta interface, aldrig på var begreppen kommer ifrån. v1: `StaticSkillTaxonomy`
 * (kurerat i repot). Senare: ESCO/SSYK kan kopplas in utan att röra logiken.
 */
export interface SkillTaxonomy {
  /** Alla kanoniska begrepp. */
  list(): Promise<CanonicalSkill[]>;

  /**
   * Kanoniserar en fri term till ett begrepp (viker in synonymer/titelvarianter),
   * eller `null` om inget begrepp känns igen.
   */
  canonicalize(term: string): Promise<CanonicalSkill | null>;
}
