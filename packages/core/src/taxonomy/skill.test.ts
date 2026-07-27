import { describe, expect, it } from "vitest";
import type { CanonicalSkill } from "./skill";
import { canonicalizeTerm } from "./skill";
import { StaticSkillTaxonomy, DEFAULT_SKILLS } from "./staticSkillTaxonomy";

const SKILLS: CanonicalSkill[] = [
  { id: "frontend", label: "Frontend-utveckling", synonyms: ["frontendutvecklare", "webbutvecklare", "ui-ingenjör"] },
  { id: "produkt", label: "Produktledning", synonyms: ["produktledare", "product manager"] },
];

describe("canonicalizeTerm", () => {
  it("viker in en synonym till samma kanoniska begrepp", () => {
    expect(canonicalizeTerm("webbutvecklare", SKILLS)?.id).toBe("frontend");
    expect(canonicalizeTerm("ui-ingenjör", SKILLS)?.id).toBe("frontend");
    expect(canonicalizeTerm("product manager", SKILLS)?.id).toBe("produkt");
  });

  it("matchar det kanoniska namnet skiftlägesokänsligt", () => {
    expect(canonicalizeTerm("FRONTEND-utveckling", SKILLS)?.id).toBe("frontend");
  });

  it("faller tillbaka på token-överlapp för olistade varianter", () => {
    // "frontend" delar token med "Frontend-utveckling".
    expect(canonicalizeTerm("senior frontend", SKILLS)?.id).toBe("frontend");
  });

  it("ger null för en okänd term", () => {
    expect(canonicalizeTerm("trädgårdsmästare", SKILLS)).toBeNull();
    expect(canonicalizeTerm("   ", SKILLS)).toBeNull();
  });
});

describe("StaticSkillTaxonomy", () => {
  it("listar begrepp och isolerar lagringen", async () => {
    const taxonomy = new StaticSkillTaxonomy();
    const list = await taxonomy.list();
    expect(list.length).toBe(DEFAULT_SKILLS.length);
    list[0]?.synonyms.push("smugglad");
    const fresh = await taxonomy.list();
    expect(fresh[0]?.synonyms).not.toContain("smugglad");
  });

  it("kanoniserar via katalogen (djungeln viks in)", async () => {
    const taxonomy = new StaticSkillTaxonomy();
    const a = await taxonomy.canonicalize("frontendutvecklare");
    const b = await taxonomy.canonicalize("webbutvecklare");
    expect(a?.id).toBe("frontend-utveckling");
    expect(b?.id).toBe("frontend-utveckling"); // samma begrepp, olika ord
  });
});
