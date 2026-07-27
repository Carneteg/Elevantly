import { describe, expect, it } from "vitest";
import { InMemoryPostRepository } from "./inMemoryPostRepository";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-02T00:00:00.000Z";
const T3 = "2026-03-03T00:00:00.000Z";

describe("InMemoryPostRepository", () => {
  it("skapar ett inlägg och ger det ett id", async () => {
    const repo = new InMemoryPostRepository();
    const post = await repo.create("a", "  Hej nätverk  ", T1);
    expect(post.id).toBeTruthy();
    expect(post.authorId).toBe("a");
    expect(post.body).toBe("Hej nätverk");
    expect(post.createdAt).toBe(T1);
  });

  it("vägrar tom text och saknad författare", async () => {
    const repo = new InMemoryPostRepository();
    await expect(repo.create("a", "   ", T1)).rejects.toThrow();
    await expect(repo.create("", "text", T1)).rejects.toThrow();
  });

  it("listar bara valda författares inlägg, nyast först", async () => {
    const repo = new InMemoryPostRepository();
    await repo.create("a", "a1", T1);
    await repo.create("b", "b1", T2);
    await repo.create("c", "c1", T3); // utanför nätverket

    const feed = await repo.listByAuthors(["a", "b"]);
    expect(feed.map((p) => p.body)).toEqual(["b1", "a1"]);
  });

  it("respekterar limit", async () => {
    const repo = new InMemoryPostRepository();
    await repo.create("a", "a1", T1);
    await repo.create("a", "a2", T2);
    await repo.create("a", "a3", T3);

    const feed = await repo.listByAuthors(["a"], 2);
    expect(feed.map((p) => p.body)).toEqual(["a3", "a2"]);
  });

  it("returnerar tomt flöde utan författare", async () => {
    const repo = new InMemoryPostRepository();
    await repo.create("a", "a1", T1);
    expect(await repo.listByAuthors([])).toEqual([]);
  });

  it("tar bara bort eget inlägg (matchar id + författare)", async () => {
    const repo = new InMemoryPostRepository();
    const mine = await repo.create("a", "mitt", T1);
    await repo.delete(mine.id, "b"); // fel författare — ingen effekt
    expect(await repo.listByAuthors(["a"])).toHaveLength(1);

    await repo.delete(mine.id, "a");
    expect(await repo.listByAuthors(["a"])).toHaveLength(0);
  });

  it("isolerar lagringen från extern mutation", async () => {
    const repo = new InMemoryPostRepository();
    const created = await repo.create("a", "text", T1);
    created.body = "manipulerad";

    const [fresh] = await repo.listByAuthors(["a"]);
    expect(fresh?.body).toBe("text");
  });

  it("grundar ett inlägg i ett beslut och bevarar grunden i flödet", async () => {
    const repo = new InMemoryPostRepository();
    await repo.create("a", "Delade en insikt", T1, {
      action: "Ledde en omställning",
      outcome: "minskade churn 12%",
    });

    const [post] = await repo.listByAuthors(["a"]);
    expect(post?.groundedIn).toEqual({
      action: "Ledde en omställning",
      outcome: "minskade churn 12%",
    });
  });

  it("normaliserar grunden (trim, utelämnar tomt outcome) och isolerar den", async () => {
    const repo = new InMemoryPostRepository();
    const created = await repo.create("a", "text", T1, {
      action: "  Byggde X  ",
      outcome: "   ",
    });
    expect(created.groundedIn).toEqual({ action: "Byggde X" });

    // Mutation av returvärdet påverkar inte lagringen.
    if (created.groundedIn) created.groundedIn.action = "manipulerad";
    const [fresh] = await repo.listByAuthors(["a"]);
    expect(fresh?.groundedIn?.action).toBe("Byggde X");
  });

  it("lämnar groundedIn odefinierad för ett ogrundat inlägg", async () => {
    const repo = new InMemoryPostRepository();
    const post = await repo.create("a", "text", T1);
    expect(post.groundedIn).toBeUndefined();
  });
});
