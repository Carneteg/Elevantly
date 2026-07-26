import { describe, expect, it } from "vitest";
import { InMemoryProfileRepository } from "./inMemoryProfileRepository";
import type { StoredProfile } from "./profile";
import type { Decision } from "../decision";

function decision(action: string): Decision {
  return {
    action,
    capabilities: [],
    responsibility: "unknown",
    sources: ["ett ordagrant citat"],
    kind: "quote",
  };
}

function profile(userId: string, actions: string[]): StoredProfile {
  return {
    userId,
    decisions: actions.map(decision),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("InMemoryProfileRepository", () => {
  it("sparar och hämtar tillbaka en profil", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(profile("user-1", ["Ledde ett team"]));

    const loaded = await repo.load("user-1");
    expect(loaded?.userId).toBe("user-1");
    expect(loaded?.decisions.map((d) => d.action)).toEqual(["Ledde ett team"]);
  });

  it("returnerar null för okänd användare", async () => {
    const repo = new InMemoryProfileRepository();
    expect(await repo.load("saknas")).toBeNull();
  });

  it("ersätter en befintlig profil vid save", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(profile("user-1", ["A"]));
    await repo.save(profile("user-1", ["B", "C"]));

    const loaded = await repo.load("user-1");
    expect(loaded?.decisions.map((d) => d.action)).toEqual(["B", "C"]);
  });

  it("raderar all data för en användare (GDPR)", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(profile("user-1", ["A"]));
    await repo.delete("user-1");
    expect(await repo.load("user-1")).toBeNull();
  });

  it("håller användare åtskilda", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(profile("user-1", ["A"]));
    await repo.save(profile("user-2", ["B"]));
    expect((await repo.load("user-1"))?.decisions[0]?.action).toBe("A");
    expect((await repo.load("user-2"))?.decisions[0]?.action).toBe("B");
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryProfileRepository();
    const input = profile("user-1", ["A"]);
    await repo.save(input);

    // Mutera indata och den hämtade kopian — lagringen ska vara opåverkad.
    input.decisions.push(decision("smugglad"));
    const loaded = await repo.load("user-1");
    loaded?.decisions.push(decision("också smugglad"));

    const fresh = await repo.load("user-1");
    expect(fresh?.decisions.map((d) => d.action)).toEqual(["A"]);
  });

  it("vägrar spara en profil utan userId", async () => {
    const repo = new InMemoryProfileRepository();
    await expect(repo.save(profile("", ["A"]))).rejects.toThrow();
  });
});
