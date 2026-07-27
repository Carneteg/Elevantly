import { describe, expect, it } from "vitest";
import type { Decision } from "../decision";
import type { CanonicalSkill } from "../taxonomy/skill";
import type { CandidateInput } from "./searchCandidates";
import { searchCandidates } from "./searchCandidates";

const SKILLS: CanonicalSkill[] = [
  { id: "frontend", label: "Frontend-utveckling", synonyms: ["webbutvecklare", "ui-ingenjör"] },
  { id: "produkt", label: "Produktledning", synonyms: ["produktledare", "prioritering"] },
  { id: "ledarskap", label: "Ledarskap", synonyms: ["teamledare"] },
];

function decision(
  action: string,
  capabilityNames: string[],
  confidence: Decision["capabilities"][number]["confidence"] = "high",
): Decision {
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

function candidate(ref: string, decisions: Decision[]): CandidateInput {
  return { ref, decisions };
}

describe("searchCandidates", () => {
  it("kanoniserar söktermen och matchar på begrepp (inte nyckelord), med förankring", () => {
    const candidates = [
      candidate("anna", [decision("Byggde en ny klient", ["webbutvecklare"])]),
    ];
    // "ui-ingenjör" är en synonym för samma begrepp som "webbutvecklare".
    const matches = searchCandidates(candidates, "ui-ingenjör", SKILLS);

    expect(matches.map((m) => m.ref)).toEqual(["anna"]);
    expect(matches[0]?.evidence[0]).toMatchObject({
      skillId: "frontend",
      skillLabel: "Frontend-utveckling",
      userCapability: "webbutvecklare",
      fromActions: ["Byggde en ny klient"],
    });
  });

  it("utesluter kandidater utan spårbart stöd (ingen påhittad matchning)", () => {
    const candidates = [
      candidate("bo", [decision("Skötte trädgården", ["trädgårdsarbete"])]),
    ];
    expect(searchCandidates(candidates, "produktledning", SKILLS)).toEqual([]);
    expect(searchCandidates([], "produktledning", SKILLS)).toEqual([]);
  });

  it("returnerar tomt när söktermen inte kan kanoniseras (inget begrepp känns igen)", () => {
    const candidates = [
      candidate("cia", [decision("Ledde produkten", ["produktledare"])]),
    ];
    expect(searchCandidates(candidates, "astrofysik", SKILLS)).toEqual([]);
  });

  it("rankar högre konfidens först och är stabil på ref", () => {
    const candidates = [
      candidate("låg", [decision("Petade lite", ["produktledare"], "low")]),
      candidate("hög", [decision("Ledde produkten", ["produktledare"], "high")]),
    ];
    const matches = searchCandidates(candidates, "produktledning", SKILLS);
    expect(matches.map((m) => m.ref)).toEqual(["hög", "låg"]);
    expect(matches[0]?.confidence).toBe("high");
  });

  it("muterar inte indata", () => {
    const candidates = [
      candidate("anna", [decision("Ledde produkten", ["produktledare"])]),
    ];
    const snapshot = JSON.stringify(candidates);
    searchCandidates(candidates, "produktledning", SKILLS);
    expect(JSON.stringify(candidates)).toBe(snapshot);
  });
});
