import { describe, expect, it } from "vitest";
import type { Decision } from "../decision";
import { decisionIdentity } from "../decisionIdentity";
import { evidenceTier, outcomeCoverage } from "./evidence";

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    action: "Ledde en omställning",
    capabilities: [],
    responsibility: "led",
    sources: ["citat"],
    kind: "quote",
    ...overrides,
  };
}

describe("evidenceTier", () => {
  it("märker allt som självrapporterat utan attesteringar", () => {
    expect(evidenceTier(decision())).toBe("self_reported");
    expect(evidenceTier(decision({ outcome: "minskade churn 12%" }))).toBe(
      "self_reported",
    );
  });

  it("blir attesterat när beslutets identitet finns bland godkända nycklar", () => {
    const d = decision();
    const attested = new Set([decisionIdentity(d)]);
    expect(evidenceTier(d, attested)).toBe("attested");
    // Ett annat beslut med annan identitet påverkas inte.
    expect(evidenceTier(decision({ action: "Något annat" }), attested)).toBe(
      "self_reported",
    );
  });
});

describe("outcomeCoverage", () => {
  it("räknar prestationer med ett icke-tomt utfall", () => {
    const decisions = [
      decision({ outcome: "minskade churn 12%" }),
      decision({ outcome: "   " }), // tomt räknas inte
      decision(), // inget utfall
    ];
    expect(outcomeCoverage(decisions)).toEqual({ total: 3, withOutcome: 1 });
  });

  it("hanterar tom lista", () => {
    expect(outcomeCoverage([])).toEqual({ total: 0, withOutcome: 0 });
  });
});
