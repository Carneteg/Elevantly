import type { Job } from "./job";
import type { JobCatalog } from "./jobCatalog";

/**
 * Seedade jobbannonser (v1) — så kandidatsidan ger värde innan arbetsgivare finns
 * (CLAUDE.md 6.2). Kraven uttrycks i kanoniska skill-id (se `DEFAULT_SKILLS`), inte
 * fritext. Företagsnamnen är påhittade exempel.
 */
export const DEFAULT_JOBS: Job[] = [
  {
    id: "frontend-nordic-fintech",
    title: "Frontendutvecklare",
    company: "Nordic Fintech AB",
    summary: "Bygg gränssnitt för en ny betalprodukt tillsammans med design och backend.",
    requiredSkillIds: ["frontend-utveckling", "kvalitet-test"],
    preferredSkillIds: ["ux-design", "systemarkitektur"],
    responsibility: "contributed",
    location: "Stockholm",
    remote: true,
  },
  {
    id: "produktledare-vera-health",
    title: "Produktledare",
    company: "Vera Health",
    summary: "Driv produktriktningen för en klinisk beslutsplattform utifrån kundvärde.",
    requiredSkillIds: ["produktledning", "dataanalys"],
    preferredSkillIds: ["ledarskap", "ux-design"],
    responsibility: "led",
    location: "Göteborg",
    remote: true,
  },
  {
    id: "plattform-skog-co",
    title: "Backend- & plattformsingenjör",
    company: "Skog & Co",
    summary: "Äg tjänster och infrastruktur i en växande logistikplattform.",
    requiredSkillIds: ["backend-utveckling", "devops"],
    preferredSkillIds: ["systemarkitektur"],
    responsibility: "owned",
    location: "Distans",
    remote: true,
  },
  {
    id: "teamledare-aurora",
    title: "Teknisk teamledare",
    company: "Aurora Labs",
    summary: "Led ett tvärfunktionellt team och ansvara för leverans och kvalitet.",
    requiredSkillIds: ["ledarskap", "systemarkitektur"],
    preferredSkillIds: ["backend-utveckling", "produktledning"],
    responsibility: "led",
    location: "Malmö",
  },
  {
    id: "affarsutvecklare-mira",
    title: "Affärsutvecklare",
    company: "Mira Group",
    summary: "Skapa tillväxt genom nya kundrelationer och affärer.",
    requiredSkillIds: ["forsaljning"],
    preferredSkillIds: ["marknadsforing", "dataanalys"],
    responsibility: "led",
    location: "Stockholm",
    remote: false,
  },
];

/** In-repo-katalog över jobb. Kloner ut annonser så listan inte kan muteras utifrån. */
export class StaticJobCatalog implements JobCatalog {
  constructor(private readonly jobs: Job[] = DEFAULT_JOBS) {}

  async list(): Promise<Job[]> {
    return this.jobs.map((job) => ({
      ...job,
      requiredSkillIds: [...job.requiredSkillIds],
      preferredSkillIds: [...job.preferredSkillIds],
    }));
  }
}
