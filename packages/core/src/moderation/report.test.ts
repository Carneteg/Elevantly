import { describe, expect, it } from "vitest";
import {
  isReportSubjectType,
  isValidReport,
  MAX_REPORT_REASON,
  normalizeReason,
} from "./report";
import { InMemoryReportRepository } from "./inMemoryReportRepository";

describe("report validering", () => {
  it("känner igen giltiga typer", () => {
    expect(isReportSubjectType("profile")).toBe(true);
    expect(isReportSubjectType("post")).toBe(true);
    expect(isReportSubjectType("message")).toBe(true);
    expect(isReportSubjectType("annat")).toBe(false);
  });

  it("kräver giltig typ och icke-tomt subjectId", () => {
    expect(isValidReport("profile", "tobias")).toBe(true);
    expect(isValidReport("profile", "   ")).toBe(false);
    expect(isValidReport("okänd", "x")).toBe(false);
  });

  it("normaliserar motiveringen (trim + kapning)", () => {
    expect(normalizeReason("  spam  ")).toBe("spam");
    expect(normalizeReason("a".repeat(MAX_REPORT_REASON + 50))).toHaveLength(
      MAX_REPORT_REASON,
    );
  });
});

describe("InMemoryReportRepository", () => {
  it("skapar en rapport med id och normaliserad motivering", async () => {
    const repo = new InMemoryReportRepository();
    const report = await repo.create(
      "user-1",
      "post",
      "post-42",
      "  olämpligt  ",
      "2026-01-01T00:00:00.000Z",
    );
    expect(report.id).toBeTruthy();
    expect(report.reporterId).toBe("user-1");
    expect(report.subjectType).toBe("post");
    expect(report.subjectId).toBe("post-42");
    expect(report.reason).toBe("olämpligt");
    expect(repo.all()).toHaveLength(1);
  });

  it("vägrar rapport utan reporter eller med ogiltigt objekt", async () => {
    const repo = new InMemoryReportRepository();
    await expect(
      repo.create("", "post", "x", "", "2026-01-01T00:00:00.000Z"),
    ).rejects.toThrow();
    await expect(
      repo.create("user-1", "post", "   ", "", "2026-01-01T00:00:00.000Z"),
    ).rejects.toThrow();
  });

  it("listar granskningskön nyast först och respekterar limit", async () => {
    const repo = new InMemoryReportRepository();
    await repo.create("u1", "post", "p1", "", "2026-01-01T00:00:00.000Z");
    await repo.create("u2", "profile", "tobias", "", "2026-03-03T00:00:00.000Z");
    await repo.create("u3", "message", "m9", "", "2026-02-02T00:00:00.000Z");

    const queue = await repo.listForReview();
    expect(queue.map((r) => r.subjectId)).toEqual(["tobias", "m9", "p1"]);

    const limited = await repo.listForReview(2);
    expect(limited.map((r) => r.subjectId)).toEqual(["tobias", "m9"]);
  });
});
