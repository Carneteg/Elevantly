import { describe, expect, it } from "vitest";
import {
  acceptedDecisionKeys,
  canGiveMore,
  isValidMotivation,
  normalizeMotivation,
  remainingBudget,
  MAX_ACTIVE_ATTESTATIONS,
  type Attestation,
} from "./attestation";

function att(overrides: Partial<Attestation> = {}): Attestation {
  return {
    id: "att_1",
    subjectUserId: "subject",
    decisionKey: "action##src",
    attesterUserId: "attester",
    motivation: "Jag satt i teamet och såg siffrorna",
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isValidMotivation", () => {
  it("kräver en kort mening, inte ett klick", () => {
    expect(isValidMotivation("för kort")).toBe(false); // < 15 tecken
    expect(isValidMotivation("Jag satt i samma team och såg utfallet")).toBe(true);
  });

  it("avvisar en tom eller enbart-whitespace-motivering", () => {
    expect(isValidMotivation("            ")).toBe(false);
  });

  it("avvisar en för lång motivering", () => {
    expect(isValidMotivation("x".repeat(281))).toBe(false);
  });
});

describe("normalizeMotivation", () => {
  it("trimmar och slår ihop whitespace", () => {
    expect(normalizeMotivation("  Jag   såg\n\nresultatet  ")).toBe(
      "Jag såg resultatet",
    );
  });
});

describe("knapphet (budget)", () => {
  it("tillåter fler tills taket, sedan inte", () => {
    expect(canGiveMore(0)).toBe(true);
    expect(canGiveMore(MAX_ACTIVE_ATTESTATIONS - 1)).toBe(true);
    expect(canGiveMore(MAX_ACTIVE_ATTESTATIONS)).toBe(false);
  });

  it("räknar återstående budget, aldrig negativt", () => {
    expect(remainingBudget(0)).toBe(MAX_ACTIVE_ATTESTATIONS);
    expect(remainingBudget(MAX_ACTIVE_ATTESTATIONS + 5)).toBe(0);
  });
});

describe("acceptedDecisionKeys", () => {
  it("tar bara med GODKÄNDA attesteringar", () => {
    const keys = acceptedDecisionKeys([
      att({ decisionKey: "a", status: "accepted" }),
      att({ decisionKey: "b", status: "pending" }),
      att({ decisionKey: "c", status: "declined" }),
      att({ decisionKey: "a", status: "accepted" }), // dubblett-nyckel → en gång
    ]);
    expect(keys.has("a")).toBe(true);
    expect(keys.has("b")).toBe(false);
    expect(keys.has("c")).toBe(false);
    expect(keys.size).toBe(1);
  });
});
