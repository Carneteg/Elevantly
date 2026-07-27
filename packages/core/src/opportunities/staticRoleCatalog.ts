import type { Role } from "./role";
import type { RoleCatalog } from "./roleCatalog";

/**
 * En kurerad uppsättning breda rollarketyper (v1). Medvetet få och tydliga
 * (CLAUDE.md 5: färre, fantastiska framför många mediokra). Kärnkompetenserna är
 * valda för att fånga vanliga professionella spår; matchningen är förklarbar och
 * grundad, inte en svart låda (CLAUDE.md 8.5).
 *
 * Detta är INTE en uttömmande taxonomi — det är en ärlig startpunkt som ger
 * värde från dag ett även för en ensam användare (CLAUDE.md 6.2). En rikare källa
 * kan ersätta den bakom `RoleCatalog`.
 */
export const DEFAULT_ROLES: Role[] = [
  {
    id: "product-lead",
    title: "Produktledare",
    summary: "Driver produktens riktning utifrån kundvärde och tydliga prioriteringar.",
    capabilities: [
      "produktstrategi",
      "prioritering",
      "kundinsikt",
      "roadmap",
      "tvärfunktionellt samarbete",
    ],
  },
  {
    id: "team-lead",
    title: "Ledare",
    summary: "Får människor och beslut att röra sig framåt, med ansvar för utfall.",
    capabilities: [
      "ledarskap",
      "mentorskap",
      "beslutsfattande",
      "ansvar",
      "coachning",
    ],
  },
  {
    id: "engineer",
    title: "Ingenjör / Utvecklare",
    summary: "Bygger och förbättrar tekniska lösningar med kvalitet och omdöme.",
    capabilities: [
      "systemdesign",
      "arkitektur",
      "kodkvalitet",
      "problemlösning",
      "teknisk leverans",
    ],
  },
  {
    id: "data-analyst",
    title: "Data & analys",
    summary: "Vänder data till insikter och mätbara beslut.",
    capabilities: [
      "dataanalys",
      "mätning",
      "experiment",
      "insikter",
      "uppföljning",
    ],
  },
  {
    id: "designer",
    title: "Designer",
    summary: "Formar användarupplevelsen utifrån research och riktiga behov.",
    capabilities: [
      "användarupplevelse",
      "design",
      "research",
      "prototyp",
      "interaktion",
    ],
  },
  {
    id: "project-lead",
    title: "Projektledare",
    summary: "Får komplexa leveranser i mål med planering och riskkontroll.",
    capabilities: [
      "projektledning",
      "planering",
      "riskhantering",
      "intressenter",
      "leverans",
    ],
  },
  {
    id: "business-developer",
    title: "Affärsutveckling & sälj",
    summary: "Skapar tillväxt genom relationer, affärer och förhandling.",
    capabilities: [
      "affärsutveckling",
      "kundrelationer",
      "förhandling",
      "tillväxt",
      "försäljning",
    ],
  },
  {
    id: "marketer",
    title: "Marknad & kommunikation",
    summary: "Bygger räckvidd och varumärke med tydlig kommunikation.",
    capabilities: [
      "marknadsföring",
      "varumärke",
      "kommunikation",
      "kampanj",
      "innehåll",
    ],
  },
];

/** In-repo-katalog över rollarketyper. Kloner ut roller så listan inte kan muteras. */
export class StaticRoleCatalog implements RoleCatalog {
  constructor(private readonly roles: Role[] = DEFAULT_ROLES) {}

  async list(): Promise<Role[]> {
    return this.roles.map((role) => ({
      ...role,
      capabilities: [...role.capabilities],
    }));
  }
}
