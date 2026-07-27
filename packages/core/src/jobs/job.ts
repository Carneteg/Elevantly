import type { ResponsibilityLevel } from "../decision";

/**
 * Var en jobbannons står i sin livscykel. `draft` = utkast (bara företagets
 * medlemmar ser), `published` = synlig och sökbar för alla inloggade, `closed` =
 * inte längre öppen (faller ur `/jobs`).
 */
export type JobStatus = "draft" | "published" | "closed";

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
  /**
   * Ägande företag (`Company.id`). Valfritt: seedade katalog-jobb saknar det, riktiga
   * annonser sätter det. Företagsnamnet finns denormaliserat i `company` för visning.
   */
  companyId?: string;
  /** Livscykelstatus. Riktiga annonser sätter det; seedade katalog-jobb är implicit publika. */
  status?: JobStatus;
  /** När annonsen skapades (ISO 8601). Valfritt för seedade jobb. */
  createdAt?: string;
}

/** Indata när ett företag postar ett jobb (allt utom id/company/companyId/createdAt). */
export interface JobInput {
  title: string;
  summary: string;
  requiredSkillIds: string[];
  preferredSkillIds: string[];
  responsibility: ResponsibilityLevel;
  location?: string;
  remote?: boolean;
  /** Startstatus — vanligen `draft` eller `published`. */
  status: JobStatus;
}

/** Är jobb-indatat giltigt att posta (icke-tom titel och minst ett obligatoriskt krav)? */
export function isValidJobInput(input: JobInput): boolean {
  return (
    input.title.trim().length > 0 &&
    input.title.trim().length <= 120 &&
    input.requiredSkillIds.length > 0
  );
}
