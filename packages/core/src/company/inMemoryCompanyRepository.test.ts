import { describe, expect, it } from "vitest";
import { InMemoryCompanyRepository } from "./inMemoryCompanyRepository";
import {
  isValidCompanyName,
  MAX_COMPANY_NAME,
  normalizeCompanySummary,
} from "./company";

const T1 = "2026-01-01T00:00:00.000Z";

describe("företag — validering", () => {
  it("kräver icke-tomt namn inom längdgränsen", () => {
    expect(isValidCompanyName("Nordic Fintech AB")).toBe(true);
    expect(isValidCompanyName("   ")).toBe(false);
    expect(isValidCompanyName("a".repeat(MAX_COMPANY_NAME + 1))).toBe(false);
  });

  it("normaliserar beskrivningen (trim, tom → undefined)", () => {
    expect(normalizeCompanySummary("  Vi bygger X  ")).toBe("Vi bygger X");
    expect(normalizeCompanySummary("   ")).toBeUndefined();
    expect(normalizeCompanySummary(undefined)).toBeUndefined();
  });
});

describe("InMemoryCompanyRepository", () => {
  it("skapar ett företag och gör skaparen till medlem", async () => {
    const repo = new InMemoryCompanyRepository();
    const company = await repo.create("user-1", "  Vera Health  ", T1, " Vård ");
    expect(company.id).toBeTruthy();
    expect(company.name).toBe("Vera Health");
    expect(company.summary).toBe("Vård");
    expect(company.createdBy).toBe("user-1");

    expect((await repo.listForUser("user-1")).map((c) => c.id)).toEqual([company.id]);
  });

  it("vägrar tomt namn eller saknad ägare", async () => {
    const repo = new InMemoryCompanyRepository();
    await expect(repo.create("user-1", "   ", T1)).rejects.toThrow();
    await expect(repo.create("", "Namn", T1)).rejects.toThrow();
  });

  it("visar bara företag man är medlem i", async () => {
    const repo = new InMemoryCompanyRepository();
    const mine = await repo.create("user-1", "Mitt AB", T1);
    await repo.create("user-2", "Annans AB", T1);

    expect((await repo.listForUser("user-1")).map((c) => c.id)).toEqual([mine.id]);
    expect(await repo.listForUser("user-3")).toEqual([]);
  });

  it("laddar ett företag via id", async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await repo.create("user-1", "Aurora Labs", T1);
    expect((await repo.load(created.id))?.name).toBe("Aurora Labs");
    expect(await repo.load("saknas")).toBeNull();
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await repo.create("user-1", "Mira Group", T1);
    created.name = "manipulerad";
    expect((await repo.load(created.id))?.name).toBe("Mira Group");
  });
});
