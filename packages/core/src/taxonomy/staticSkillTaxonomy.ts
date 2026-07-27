import type { CanonicalSkill } from "./skill";
import { canonicalizeTerm } from "./skill";
import type { SkillTaxonomy } from "./skillTaxonomy";

/**
 * En kurerad uppsättning kanoniska kompetensbegrepp (v1). Medvetet få och breda
 * (CLAUDE.md 5) med svenska och engelska synonymer/titelvarianter så att fritext
 * från olika håll viks in till samma begrepp. Detta är INTE en uttömmande taxonomi
 * — det är en ärlig startpunkt som kan ersättas av ESCO/SSYK bakom `SkillTaxonomy`.
 */
export const DEFAULT_SKILLS: CanonicalSkill[] = [
  {
    id: "frontend-utveckling",
    label: "Frontend-utveckling",
    synonyms: ["frontendutvecklare", "webbutvecklare", "ui-ingenjör", "frontend developer", "klientutveckling", "react-utvecklare"],
  },
  {
    id: "backend-utveckling",
    label: "Backend-utveckling",
    synonyms: ["backendutvecklare", "serverutveckling", "api-utveckling", "backend developer", "systemutveckling"],
  },
  {
    id: "systemarkitektur",
    label: "Systemarkitektur",
    synonyms: ["arkitektur", "systemdesign", "lösningsarkitekt", "teknisk arkitektur", "software architect"],
  },
  {
    id: "produktledning",
    label: "Produktledning",
    synonyms: ["produktledare", "product manager", "produktägare", "product owner", "produktstrategi", "prioritering"],
  },
  {
    id: "ledarskap",
    label: "Ledarskap",
    synonyms: ["teamledare", "ledare", "chef", "people management", "mentorskap", "coachning", "engineering manager"],
  },
  {
    id: "projektledning",
    label: "Projektledning",
    synonyms: ["projektledare", "scrum master", "leveransledning", "program manager", "planering", "riskhantering"],
  },
  {
    id: "dataanalys",
    label: "Data & analys",
    synonyms: ["dataanalytiker", "analytiker", "business intelligence", "bi", "data scientist", "mätning", "insikter", "experiment"],
  },
  {
    id: "ux-design",
    label: "UX & design",
    synonyms: ["designer", "ux-designer", "interaktionsdesign", "användarupplevelse", "ui/ux", "produktdesign", "research"],
  },
  {
    id: "devops",
    label: "DevOps & infrastruktur",
    synonyms: ["sre", "infrastruktur", "plattformsutveckling", "cloud", "devops-ingenjör", "drift"],
  },
  {
    id: "forsaljning",
    label: "Försäljning & affär",
    synonyms: ["säljare", "account manager", "affärsutveckling", "business development", "förhandling", "kundrelationer", "tillväxt"],
  },
  {
    id: "marknadsforing",
    label: "Marknad & kommunikation",
    synonyms: ["marknadsförare", "growth", "kommunikation", "varumärke", "kampanj", "content", "innehåll"],
  },
  {
    id: "kvalitet-test",
    label: "Kvalitet & test",
    synonyms: ["testare", "qa", "kvalitetssäkring", "testautomation", "kodkvalitet"],
  },
];

/** In-repo-taxonomi. Kloner ut begrepp så listan inte kan muteras utifrån. */
export class StaticSkillTaxonomy implements SkillTaxonomy {
  constructor(private readonly skills: CanonicalSkill[] = DEFAULT_SKILLS) {}

  async list(): Promise<CanonicalSkill[]> {
    return this.skills.map((skill) => ({
      ...skill,
      synonyms: [...skill.synonyms],
    }));
  }

  async canonicalize(term: string): Promise<CanonicalSkill | null> {
    const match = canonicalizeTerm(term, this.skills);
    return match ? { ...match, synonyms: [...match.synonyms] } : null;
  }
}
