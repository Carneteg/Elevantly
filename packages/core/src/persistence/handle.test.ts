import { describe, expect, it } from "vitest";
import { isValidHandle, normalizeHandle } from "./handle";

describe("normalizeHandle", () => {
  it("trimmar och gör om till gemener", () => {
    expect(normalizeHandle("  Tobias  ")).toBe("tobias");
    expect(normalizeHandle("MittNamn")).toBe("mittnamn");
  });
});

describe("isValidHandle", () => {
  it("godkänner gemener, siffror, understreck och bindestreck (3–30 tecken)", () => {
    expect(isValidHandle("tobias")).toBe(true);
    expect(isValidHandle("anna-42")).toBe(true);
    expect(isValidHandle("user_name")).toBe(true);
    expect(isValidHandle("abc")).toBe(true);
  });

  it("normaliserar innan validering (versaler och whitespace är okej)", () => {
    expect(isValidHandle("  Tobias  ")).toBe(true);
  });

  it("underkänner för kort, för långt och otillåtna tecken", () => {
    expect(isValidHandle("ab")).toBe(false);
    expect(isValidHandle("a".repeat(31))).toBe(false);
    expect(isValidHandle("med mellanslag")).toBe(false);
    expect(isValidHandle("emoji😀")).toBe(false);
    expect(isValidHandle("prick.punkt")).toBe(false);
    expect(isValidHandle("")).toBe(false);
  });
});
