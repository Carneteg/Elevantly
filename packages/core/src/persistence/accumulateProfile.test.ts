import { describe, expect, it } from "vitest";
import {
  MAX_PROFILE_DECISIONS,
  mergeDecisions,
  upsertProfile,
} from "./accumulateProfile";
import type { Decision } from "../decision";
import type { StoredProfile } from "./profile";

function decision(action: string, sources: string[] = ["ett citat"]): Decision {
  return {
    action,
    capabilities: [],
    responsibility: "unknown",
    sources,
    kind: "quote",
  };
}

describe("mergeDecisions", () => {
  it("lägger till nya beslut sist", () => {
    const merged = mergeDecisions([decision("A")], [decision("B")]);
    expect(merged.map((d) => d.action)).toEqual(["A", "B"]);
  });

  it("hoppar över exakta dubbletter (handling + källor)", () => {
    const merged = mergeDecisions(
      [decision("Ledde ett team", ["ledde ett team på fyra"])],
      [decision("Ledde ett team", ["ledde ett team på fyra"])],
    );
    expect(merged).toHaveLength(1);
  });

  it("är skiftläges- och whitespace-okänslig, och okänslig för källordning", () => {
    const merged = mergeDecisions(
      [decision("Ledde ett Team", ["A", "B"])],
      [decision("  ledde   ett team ", ["B", "A"])],
    );
    expect(merged).toHaveLength(1);
  });

  it("behandlar olika källor som olika beslut", () => {
    const merged = mergeDecisions(
      [decision("Ledde ett team", ["A"])],
      [decision("Ledde ett team", ["B"])],
    );
    expect(merged).toHaveLength(2);
  });

  it("kapar till de senaste vid överskriden gräns", () => {
    const existing = Array.from({ length: MAX_PROFILE_DECISIONS }, (_u, i) =>
      decision(`gammal-${i}`),
    );
    const merged = mergeDecisions(existing, [decision("ny")], MAX_PROFILE_DECISIONS);
    expect(merged).toHaveLength(MAX_PROFILE_DECISIONS);
    // Äldsta släpptes, nyaste finns kvar.
    expect(merged[merged.length - 1]?.action).toBe("ny");
    expect(merged.some((d) => d.action === "gammal-0")).toBe(false);
  });
});

describe("upsertProfile", () => {
  it("skapar en ny profil när ingen finns", () => {
    const profile = upsertProfile(null, "user-1", [decision("A")], "2026-01-01T00:00:00.000Z");
    expect(profile).toEqual<StoredProfile>({
      userId: "user-1",
      decisions: [decision("A")],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("uppdaterar en befintlig profil: behåller createdAt, bumpar updatedAt, slår ihop beslut", () => {
    const existing: StoredProfile = {
      userId: "user-1",
      decisions: [decision("A")],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const updated = upsertProfile(existing, "user-1", [decision("B")], "2026-02-02T00:00:00.000Z");
    expect(updated.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(updated.updatedAt).toBe("2026-02-02T00:00:00.000Z");
    expect(updated.decisions.map((d) => d.action)).toEqual(["A", "B"]);
  });

  it("lägger inte till en dubblett vid återbesök", () => {
    const existing: StoredProfile = {
      userId: "user-1",
      decisions: [decision("A")],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const updated = upsertProfile(existing, "user-1", [decision("A")], "2026-02-02T00:00:00.000Z");
    expect(updated.decisions).toHaveLength(1);
  });

  it("kräver userId", () => {
    expect(() => upsertProfile(null, "", [decision("A")], "2026-01-01T00:00:00.000Z")).toThrow();
  });
});
