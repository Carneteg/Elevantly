import { describe, expect, it } from "vitest";
import { InMemoryBlockRepository } from "./inMemoryBlockRepository";

const T1 = "2026-01-01T00:00:00.000Z";

describe("InMemoryBlockRepository", () => {
  it("blockerar och känner igen den riktade blockeringen", async () => {
    const repo = new InMemoryBlockRepository();
    await repo.block("a", "b", T1);
    expect(await repo.hasBlocked("a", "b")).toBe(true);
    // Riktat: b har inte blockerat a.
    expect(await repo.hasBlocked("b", "a")).toBe(false);
  });

  it("vägrar blockera sig själv eller med tom part", async () => {
    const repo = new InMemoryBlockRepository();
    await expect(repo.block("a", "a", T1)).rejects.toThrow();
    await expect(repo.block("a", "", T1)).rejects.toThrow();
  });

  it("är idempotent", async () => {
    const repo = new InMemoryBlockRepository();
    await repo.block("a", "b", T1);
    await repo.block("a", "b", T1);
    expect(await repo.listBlocked("a")).toHaveLength(1);
  });

  it("isBlockedBetween är ömsesidig (endera riktning räcker)", async () => {
    const repo = new InMemoryBlockRepository();
    await repo.block("a", "b", T1);
    expect(await repo.isBlockedBetween("a", "b")).toBe(true);
    expect(await repo.isBlockedBetween("b", "a")).toBe(true);
    expect(await repo.isBlockedBetween("a", "c")).toBe(false);
  });

  it("häver en blockering", async () => {
    const repo = new InMemoryBlockRepository();
    await repo.block("a", "b", T1);
    await repo.unblock("a", "b");
    expect(await repo.hasBlocked("a", "b")).toBe(false);
    expect(await repo.isBlockedBetween("a", "b")).toBe(false);
  });

  it("listar bara egna blockeringar", async () => {
    const repo = new InMemoryBlockRepository();
    await repo.block("a", "b", T1);
    await repo.block("a", "c", T1);
    await repo.block("x", "y", T1);
    const mine = await repo.listBlocked("a");
    expect(mine.map((b) => b.blockedId).sort()).toEqual(["b", "c"]);
  });
});
