import { describe, expect, it } from "vitest";
import type { Decision } from "../decision";
import type { Role } from "./role";
import { normalizeText, tokenize } from "./role";
import { matchRoles } from "./matchRoles";

function decision(action: string, capabilities: string[], confidence: Decision["capabilities"][number]["confidence"] = "medium"): Decision {
  return {
    action,
    capabilities: capabilities.map((name) => ({
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

const ROLES: Role[] = [
  {
    id: "product-lead",
    title: "Produktledare",
    summary: "…",
    capabilities: ["produktstrategi", "prioritering", "kundinsikt"],
  },
  {
    id: "engineer",
    title: "Ingenjör",
    summary: "…",
    capabilities: ["arkitektur", "kodkvalitet"],
  },
];

describe("tokenisering", () => {
  it("normaliserar gemener, skiljetecken och behåller å ä ö", () => {
    expect(normalizeText("Kund-Insikt, på RIKTIGT!")).toBe("kund insikt på riktigt");
  });

  it("tar bort stoppord och för korta ord", () => {
    expect(tokenize("ansvar för leverans")).toEqual(["ansvar", "leverans"]);
  });
});

describe("matchRoles", () => {
  it("matchar bara roller med spårbart stöd och rankar högst först", () => {
    const decisions = [
      decision("Satte produktstrategi och roadmap", ["produktstrategi"], "high"),
      decision("Prioriterade backlog utifrån kundinsikt", ["prioritering", "kundinsikt"], "high"),
    ];

    const matches = matchRoles(decisions, ROLES);

    // Ingenjörsrollen saknar stöd → returneras inte (ingen påhittad riktning).
    expect(matches.map((m) => m.role.id)).toEqual(["product-lead"]);
    expect(matches[0]?.matchedCount).toBe(3);
    expect(matches[0]?.totalCount).toBe(3);
  });

  it("bevisrar varje match ner till en handling", () => {
    const decisions = [decision("Ritade om systemarkitektur", ["arkitektur"])];
    const match = matchRoles(decisions, ROLES)[0];

    expect(match?.role.id).toBe("engineer");
    expect(match?.evidence).toHaveLength(1);
    expect(match?.evidence[0]).toMatchObject({
      roleCapability: "arkitektur",
      userCapability: "arkitektur",
      fromActions: ["Ritade om systemarkitektur"],
    });
  });

  it("rankar rollen med starkare stöd (poäng) först", () => {
    const decisions = [
      // Stödjer produktledare svagt (låg konfidens, en kompetens).
      decision("Bidrog till prioritering", ["prioritering"], "low"),
      // Stödjer ingenjör starkt (hög konfidens, två kompetenser).
      decision("Ägde arkitektur och kodkvalitet", ["arkitektur", "kodkvalitet"], "high"),
    ];

    const matches = matchRoles(decisions, ROLES);
    expect(matches.map((m) => m.role.id)).toEqual(["engineer", "product-lead"]);
    expect(matches[0]?.score ?? 0).toBeGreaterThan(matches[1]?.score ?? 0);
  });

  it("ger tom lista utan beslut eller utan matchande kompetenser", () => {
    expect(matchRoles([], ROLES)).toEqual([]);
    expect(matchRoles([decision("Nåt helt orelaterat", ["trädgårdsarbete"])], ROLES)).toEqual([]);
  });

  it("muterar inte indata", () => {
    const decisions = [decision("Satte produktstrategi", ["produktstrategi"])];
    const snapshot = JSON.stringify(decisions);
    matchRoles(decisions, ROLES);
    expect(JSON.stringify(decisions)).toBe(snapshot);
  });
});
