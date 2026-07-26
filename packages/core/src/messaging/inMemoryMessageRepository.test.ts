import { describe, expect, it } from "vitest";
import { InMemoryMessageRepository } from "./inMemoryMessageRepository";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-02T00:00:00.000Z";
const T3 = "2026-03-03T00:00:00.000Z";

describe("InMemoryMessageRepository", () => {
  it("skickar ett meddelande och ger det ett id", async () => {
    const repo = new InMemoryMessageRepository();
    const msg = await repo.send("a", "b", "  Hej!  ", T1);
    expect(msg.id).toBeTruthy();
    expect(msg.senderId).toBe("a");
    expect(msg.recipientId).toBe("b");
    expect(msg.body).toBe("Hej!");
  });

  it("vägrar tom text, saknad part och meddelande till sig själv", async () => {
    const repo = new InMemoryMessageRepository();
    await expect(repo.send("a", "b", "   ", T1)).rejects.toThrow();
    await expect(repo.send("a", "", "hej", T1)).rejects.toThrow();
    await expect(repo.send("a", "a", "hej", T1)).rejects.toThrow();
  });

  it("listar tråden mellan två parter, äldst först, oavsett riktning", async () => {
    const repo = new InMemoryMessageRepository();
    await repo.send("a", "b", "1", T1);
    await repo.send("b", "a", "2", T2);
    await repo.send("a", "b", "3", T3);

    const thread = await repo.listThread("a", "b");
    expect(thread.map((m) => m.body)).toEqual(["1", "2", "3"]);
  });

  it("blandar inte in meddelanden med andra parter", async () => {
    const repo = new InMemoryMessageRepository();
    await repo.send("a", "b", "till b", T1);
    await repo.send("a", "c", "till c", T2);

    const thread = await repo.listThread("a", "b");
    expect(thread.map((m) => m.body)).toEqual(["till b"]);
  });

  it("respekterar limit och behåller de senaste", async () => {
    const repo = new InMemoryMessageRepository();
    await repo.send("a", "b", "1", T1);
    await repo.send("a", "b", "2", T2);
    await repo.send("a", "b", "3", T3);

    const thread = await repo.listThread("a", "b", 2);
    expect(thread.map((m) => m.body)).toEqual(["2", "3"]);
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryMessageRepository();
    const sent = await repo.send("a", "b", "text", T1);
    sent.body = "manipulerad";

    const [fresh] = await repo.listThread("a", "b");
    expect(fresh?.body).toBe("text");
  });
});
