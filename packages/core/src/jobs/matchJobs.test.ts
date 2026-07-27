import { describe, expect, it } from "vitest";
import type { Decision } from "../decision";
import type { CanonicalSkill } from "../taxonomy/skill";
import type { Job } from "./job";
import { matchJobs } from "./matchJobs";

const SKILLS: CanonicalSkill[] = [
  { id: "frontend", label: "Frontend-utveckling", synonyms: ["webbutvecklare", "ui-ingenjör"] },
  { id: "produkt", label: "Produktledning", synonyms: ["produktledare", "prioritering"] },
  { id: "ledarskap", label: "Ledarskap", synonyms: ["teamledare"] },
];

const JOBS: Job[] = [
  {
    id: "fe",
    title: "Frontendutvecklare",
    company: "A",
    summary: "",
    requiredSkillIds: ["frontend"],
    preferredSkillIds: ["produkt"],
    responsibility: "contributed",
  },
  {
    id: "pm",
    title: "Produktledare",
    company: "B",
    summary: "",
    requiredSkillIds: ["produkt", "ledarskap"],
    preferredSkillIds: [],
    responsibility: "led",
  },
];

function decision(action: string, capabilityNames: string[], confidence: Decision["capabilities"][number]["confidence"] = "high"): Decision {
  return {
    action,
    capabilities: capabilityNames.map((name) => ({
      name,
      kind: "interpretation",
      confidence,
      sources: ["citat"],
    })),
    responsibility: "led",
    sources: ["citat"],
    kind: "quote",
  };
}

describe("matchJobs", () => {
  it("kanoniserar kandidatens kompetenser och matchar på begrepp (inte nyckelord)", () => {
    // "webbutvecklare" är en synonym för frontend-begreppet.
    const decisions = [decision("Byggde en ny klient", ["webbutvecklare"])];
    const matches = matchJobs(decisions, JOBS, SKILLS);

    expect(matches.map((m) => m.job.id)).toEqual(["fe"]);
    const fe = matches[0];
    expect(fe?.requiredMatched).toBe(1);
    expect(fe?.evidence[0]).toMatchObject({
      skillId: "frontend",
      required: true,
      userCapability: "webbutvecklare",
      fromActions: ["Byggde en ny klient"],
    });
  });

  it("returnerar inga jobb utan spårbart stöd (ingen påhittad matchning)", () => {
    const decisions = [decision("Skötte trädgården", ["trädgårdsarbete"])];
    expect(matchJobs(decisions, JOBS, SKILLS)).toEqual([]);
    expect(matchJobs([], JOBS, SKILLS)).toEqual([]);
  });

  it("rankar jobbet med starkare stöd först och räknar täckning", () => {
    const decisions = [
      decision("Ledde produkten", ["produktledare", "teamledare"], "high"),
      decision("Petade lite frontend", ["webbutvecklare"], "low"),
    ];
    const matches = matchJobs(decisions, JOBS, SKILLS);
    // pm täcker 2 obligatoriska (hög konfidens) → starkare än fe (1 oblig., låg).
    expect(matches.map((m) => m.job.id)).toEqual(["pm", "fe"]);
    const pm = matches.find((m) => m.job.id === "pm");
    expect(pm?.requiredMatched).toBe(2);
    expect(pm?.requiredTotal).toBe(2);
  });

  it("muterar inte indata", () => {
    const decisions = [decision("Ledde produkten", ["produktledare"])];
    const snapshot = JSON.stringify(decisions);
    matchJobs(decisions, JOBS, SKILLS);
    expect(JSON.stringify(decisions)).toBe(snapshot);
  });
});
