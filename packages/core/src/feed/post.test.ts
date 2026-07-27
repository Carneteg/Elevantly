import { describe, expect, it } from "vitest";
import {
  isValidPostBody,
  MAX_POST_LENGTH,
  normalizePostBody,
  orderFeed,
} from "./post";
import type { Post } from "./post";

function post(id: string, createdAt: string): Post {
  return { id, authorId: "a", body: "text", createdAt };
}

describe("normalizePostBody / isValidPostBody", () => {
  it("trimmar texten", () => {
    expect(normalizePostBody("  hej  ")).toBe("hej");
  });

  it("godkänner icke-tom text inom längdgränsen", () => {
    expect(isValidPostBody("Ett vettigt inlägg")).toBe(true);
  });

  it("underkänner tom text (även bara whitespace)", () => {
    expect(isValidPostBody("")).toBe(false);
    expect(isValidPostBody("   ")).toBe(false);
  });

  it("underkänner text över längdgränsen", () => {
    expect(isValidPostBody("a".repeat(MAX_POST_LENGTH))).toBe(true);
    expect(isValidPostBody("a".repeat(MAX_POST_LENGTH + 1))).toBe(false);
  });
});

describe("orderFeed", () => {
  it("ordnar nyast först", () => {
    const feed = orderFeed([
      post("1", "2026-01-01T00:00:00.000Z"),
      post("3", "2026-03-01T00:00:00.000Z"),
      post("2", "2026-02-01T00:00:00.000Z"),
    ]);
    expect(feed.map((p) => p.id)).toEqual(["3", "2", "1"]);
  });

  it("muterar inte indata", () => {
    const input = [
      post("1", "2026-01-01T00:00:00.000Z"),
      post("2", "2026-02-01T00:00:00.000Z"),
    ];
    orderFeed(input);
    expect(input.map((p) => p.id)).toEqual(["1", "2"]);
  });
});
