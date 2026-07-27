import { describe, expect, it } from "vitest";
import { InMemoryConnectionRepository } from "./inMemoryConnectionRepository";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-02T00:00:00.000Z";

describe("InMemoryConnectionRepository", () => {
  it("skapar en pending-förfrågan och hittar den i endera riktning", async () => {
    const repo = new InMemoryConnectionRepository();
    const created = await repo.request("a", "b", T1);
    expect(created.status).toBe("pending");

    const fromA = await repo.findBetween("a", "b");
    const fromB = await repo.findBetween("b", "a");
    expect(fromA?.requesterId).toBe("a");
    expect(fromB?.addresseeId).toBe("b");
  });

  it("vägrar en förfrågan till sig själv", async () => {
    const repo = new InMemoryConnectionRepository();
    await expect(repo.request("a", "a", T1)).rejects.toThrow();
  });

  it("vägrar en dubblettförfrågan (en post per par)", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);
    await expect(repo.request("a", "b", T1)).rejects.toThrow();
    await expect(repo.request("b", "a", T1)).rejects.toThrow();
  });

  it("accepterar en väntande förfrågan och bumpar tiden", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);
    await repo.accept("a", "b", T2);

    const connection = await repo.findBetween("a", "b");
    expect(connection?.status).toBe("accepted");
    expect(connection?.updatedAt).toBe(T2);
  });

  it("listar accepterade kontakter för båda parter", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);
    await repo.accept("a", "b", T2);

    expect(await repo.listAccepted("a")).toHaveLength(1);
    expect(await repo.listAccepted("b")).toHaveLength(1);
    expect(await repo.listAccepted("c")).toHaveLength(0);
  });

  it("listar inkommande väntande förfrågningar bara för mottagaren", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);

    expect(await repo.listIncomingPending("b")).toHaveLength(1);
    // Avsändaren har ingen inkommande förfrågan.
    expect(await repo.listIncomingPending("a")).toHaveLength(0);
  });

  it("en accepterad koppling räknas inte som inkommande förfrågan", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);
    await repo.accept("a", "b", T2);
    expect(await repo.listIncomingPending("b")).toHaveLength(0);
  });

  it("tar bort en koppling (avböj/ta bort kontakt) i endera riktning", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1);
    await repo.remove("b", "a");
    expect(await repo.findBetween("a", "b")).toBeNull();
  });

  it("listar ALLA kopplingar för en användare oavsett status/riktning (export)", async () => {
    const repo = new InMemoryConnectionRepository();
    await repo.request("a", "b", T1); // a är requester (pending)
    await repo.request("c", "a", T1); // a är addressee (pending)
    await repo.request("b", "c", T1); // rör inte a

    const all = await repo.listAllForUser("a");
    expect(all).toHaveLength(2);
    expect(all.every((c) => c.requesterId === "a" || c.addresseeId === "a")).toBe(
      true,
    );
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryConnectionRepository();
    const created = await repo.request("a", "b", T1);
    created.status = "accepted";

    const fresh = await repo.findBetween("a", "b");
    expect(fresh?.status).toBe("pending");
  });
});
