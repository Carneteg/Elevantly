import { describe, expect, it } from "vitest";
import { InMemoryJobRepository } from "./inMemoryJobRepository";
import type { JobInput } from "./job";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-02T00:00:00.000Z";

function input(overrides: Partial<JobInput> = {}): JobInput {
  return {
    title: "Frontendutvecklare",
    summary: "Bygg gränssnitt.",
    requiredSkillIds: ["frontend-utveckling"],
    preferredSkillIds: ["ux-design"],
    responsibility: "contributed",
    status: "published",
    ...overrides,
  };
}

describe("InMemoryJobRepository", () => {
  it("skapar ett jobb med företag, status och denormaliserat namn", async () => {
    const repo = new InMemoryJobRepository();
    const job = await repo.create("c1", "Nordic Fintech AB", input(), T1);
    expect(job.id).toBeTruthy();
    expect(job.companyId).toBe("c1");
    expect(job.company).toBe("Nordic Fintech AB");
    expect(job.status).toBe("published");
    expect(job.requiredSkillIds).toEqual(["frontend-utveckling"]);
  });

  it("vägrar jobb utan titel eller utan obligatoriskt krav", async () => {
    const repo = new InMemoryJobRepository();
    await expect(
      repo.create("c1", "AB", input({ title: "  " }), T1),
    ).rejects.toThrow();
    await expect(
      repo.create("c1", "AB", input({ requiredSkillIds: [] }), T1),
    ).rejects.toThrow();
  });

  it("listPublished visar bara publicerade jobb, nyast först", async () => {
    const repo = new InMemoryJobRepository();
    await repo.create("c1", "AB", input({ title: "Publik", status: "published" }), T1);
    await repo.create("c1", "AB", input({ title: "Utkast", status: "draft" }), T2);

    const published = await repo.listPublished();
    expect(published.map((j) => j.title)).toEqual(["Publik"]);
  });

  it("listByCompany visar alla statusar för företaget", async () => {
    const repo = new InMemoryJobRepository();
    await repo.create("c1", "AB", input({ title: "A", status: "published" }), T1);
    await repo.create("c1", "AB", input({ title: "B", status: "draft" }), T2);
    await repo.create("c2", "CD", input({ title: "C" }), T2);

    const mine = await repo.listByCompany("c1");
    expect(mine.map((j) => j.title)).toEqual(["B", "A"]); // nyast först
  });

  it("setStatus ändrar status bara för rätt företag", async () => {
    const repo = new InMemoryJobRepository();
    const job = await repo.create("c1", "AB", input({ status: "draft" }), T1);

    await repo.setStatus(job.id, "c2", "published"); // fel företag → ingen effekt
    expect((await repo.listByCompany("c1"))[0]?.status).toBe("draft");

    await repo.setStatus(job.id, "c1", "published");
    expect((await repo.listPublished()).map((j) => j.id)).toContain(job.id);
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryJobRepository();
    const created = await repo.create("c1", "AB", input(), T1);
    created.title = "manipulerad";
    expect((await repo.listByCompany("c1"))[0]?.title).toBe("Frontendutvecklare");
  });
});
