import type { ResponsibilityLevel } from "../decision";

/**
 * En jobbannons (roadmap pelare 6). KÄRNAN i "smartare än LinkedIn": ett jobb
 * beskrivs som STRUKTURERADE krav — kanoniska kompetensbegrepp (via `SkillTaxonomy`)
 * plus förväntad ansvarsnivå — inte en fritextklump med synonymer och titlar. Så
 * kan kandidat↔jobb matchas på struktur (id), inte på nyckelord (CLAUDE.md 7.3/8.5).
 *
 * `requiredSkillIds`/`preferredSkillIds` refererar `CanonicalSkill.id`. Fritext
 * (`summary`) visas men driver inte matchningen.
 */
export interface Job {
  /** Stabilt id. */
  id: string;
  /** Jobbtitel (visning). */
  title: string;
  /** Arbetsgivare (visning). */
  company: string;
  /** Kort beskrivning (fritext, driver inte matchningen). */
  summary: string;
  /** Obligatoriska kanoniska kompetensbegrepp (`CanonicalSkill.id`). */
  requiredSkillIds: string[];
  /** Meriterande kanoniska kompetensbegrepp. */
  preferredSkillIds: string[];
  /** Förväntad ansvarsnivå (återanvänder `ResponsibilityLevel`). */
  responsibility: ResponsibilityLevel;
  /** Plats (visning). Valfri. */
  location?: string;
  /** Går att göra på distans. Valfri. */
  remote?: boolean;
}
