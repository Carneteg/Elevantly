import { describe, expect, it } from "vitest";
import {
  involvesBoth,
  isValidMessageBody,
  MAX_MESSAGE_LENGTH,
  normalizeMessageBody,
  orderThread,
} from "./message";
import type { Message } from "./message";

function message(
  id: string,
  senderId: string,
  recipientId: string,
  createdAt: string,
): Message {
  return { id, senderId, recipientId, body: "hej", createdAt };
}

describe("normalizeMessageBody / isValidMessageBody", () => {
  it("trimmar texten", () => {
    expect(normalizeMessageBody("  hej  ")).toBe("hej");
  });

  it("godkänner icke-tom text inom längdgränsen", () => {
    expect(isValidMessageBody("Hej, kul att ses!")).toBe(true);
    expect(isValidMessageBody("a".repeat(MAX_MESSAGE_LENGTH))).toBe(true);
  });

  it("underkänner tom och för lång text", () => {
    expect(isValidMessageBody("   ")).toBe(false);
    expect(isValidMessageBody("a".repeat(MAX_MESSAGE_LENGTH + 1))).toBe(false);
  });
});

describe("involvesBoth", () => {
  it("matchar oavsett riktning", () => {
    const m = message("1", "a", "b", "2026-01-01T00:00:00.000Z");
    expect(involvesBoth(m, "a", "b")).toBe(true);
    expect(involvesBoth(m, "b", "a")).toBe(true);
  });

  it("matchar inte en utomstående", () => {
    const m = message("1", "a", "b", "2026-01-01T00:00:00.000Z");
    expect(involvesBoth(m, "a", "c")).toBe(false);
  });
});

describe("orderThread", () => {
  it("ordnar äldst först", () => {
    const thread = orderThread([
      message("2", "a", "b", "2026-02-01T00:00:00.000Z"),
      message("1", "a", "b", "2026-01-01T00:00:00.000Z"),
      message("3", "b", "a", "2026-03-01T00:00:00.000Z"),
    ]);
    expect(thread.map((m) => m.id)).toEqual(["1", "2", "3"]);
  });

  it("muterar inte indata", () => {
    const input = [
      message("2", "a", "b", "2026-02-01T00:00:00.000Z"),
      message("1", "a", "b", "2026-01-01T00:00:00.000Z"),
    ];
    orderThread(input);
    expect(input.map((m) => m.id)).toEqual(["2", "1"]);
  });
});
