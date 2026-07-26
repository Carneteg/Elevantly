import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProfileRepository } from "./supabaseProfileRepository";
import type { Decision } from "../decision";
import type { StoredProfile } from "./profile";

/**
 * Testar repots egen logik (mappning rad↔profil, not-found, felhantering) mot en
 * fejkad Supabase-klient som fångar anropen. Ingen riktig databas eller nyckel.
 */

const DECISION: Decision = {
  action: "Ledde ett team",
  capabilities: [],
  responsibility: "led",
  sources: ["ledde ett team"],
  kind: "quote",
};

interface FakeResponses {
  load?: { data: unknown; error: { message: string } | null };
  save?: { error: { message: string } | null };
  remove?: { error: { message: string } | null };
}

function makeFakeClient(responses: FakeResponses = {}) {
  const calls: {
    table?: string;
    loadedUserId?: string;
    upsertRow?: Record<string, unknown>;
    onConflict?: string;
    deletedUserId?: string;
  } = {};

  const client = {
    from(table: string) {
      calls.table = table;
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              calls.loadedUserId = value;
              return {
                maybeSingle() {
                  return Promise.resolve(
                    responses.load ?? { data: null, error: null },
                  );
                },
              };
            },
          };
        },
        upsert(row: Record<string, unknown>, options: { onConflict: string }) {
          calls.upsertRow = row;
          calls.onConflict = options.onConflict;
          return Promise.resolve(responses.save ?? { error: null });
        },
        delete() {
          return {
            eq(_column: string, value: string) {
              calls.deletedUserId = value;
              return Promise.resolve(responses.remove ?? { error: null });
            },
          };
        },
      };
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

function profile(userId: string): StoredProfile {
  return {
    userId,
    decisions: [DECISION],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-02T00:00:00.000Z",
  };
}

describe("SupabaseProfileRepository", () => {
  it("mappar en databasrad till StoredProfile vid load", async () => {
    const { client, calls } = makeFakeClient({
      load: {
        data: {
          user_id: "user-1",
          decisions: [DECISION],
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-02-02T00:00:00.000Z",
        },
        error: null,
      },
    });
    const repo = new SupabaseProfileRepository(client);

    const loaded = await repo.load("user-1");
    expect(calls.table).toBe("profiles");
    expect(calls.loadedUserId).toBe("user-1");
    expect(loaded).toEqual({
      userId: "user-1",
      decisions: [DECISION],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-02T00:00:00.000Z",
    });
  });

  it("returnerar null när ingen rad finns", async () => {
    const { client } = makeFakeClient({ load: { data: null, error: null } });
    const repo = new SupabaseProfileRepository(client);
    expect(await repo.load("saknas")).toBeNull();
  });

  it("kastar vid läsfel", async () => {
    const { client } = makeFakeClient({
      load: { data: null, error: { message: "boom" } },
    });
    const repo = new SupabaseProfileRepository(client);
    await expect(repo.load("user-1")).rejects.toThrow(/boom/);
  });

  it("skriver rätt rad (snake_case) vid save", async () => {
    const { client, calls } = makeFakeClient();
    const repo = new SupabaseProfileRepository(client);

    await repo.save(profile("user-1"));
    expect(calls.onConflict).toBe("user_id");
    expect(calls.upsertRow).toEqual({
      user_id: "user-1",
      decisions: [DECISION],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-02-02T00:00:00.000Z",
    });
  });

  it("kastar vid sparfel", async () => {
    const { client } = makeFakeClient({ save: { error: { message: "nope" } } });
    const repo = new SupabaseProfileRepository(client);
    await expect(repo.save(profile("user-1"))).rejects.toThrow(/nope/);
  });

  it("vägrar spara utan userId (innan klienten anropas)", async () => {
    const { client, calls } = makeFakeClient();
    const repo = new SupabaseProfileRepository(client);
    await expect(repo.save(profile(""))).rejects.toThrow();
    expect(calls.upsertRow).toBeUndefined();
  });

  it("raderar rätt användare", async () => {
    const { client, calls } = makeFakeClient();
    const repo = new SupabaseProfileRepository(client);
    await repo.delete("user-1");
    expect(calls.deletedUserId).toBe("user-1");
  });

  it("kastar vid raderingsfel", async () => {
    const { client } = makeFakeClient({ remove: { error: { message: "fail" } } });
    const repo = new SupabaseProfileRepository(client);
    await expect(repo.delete("user-1")).rejects.toThrow(/fail/);
  });
});
