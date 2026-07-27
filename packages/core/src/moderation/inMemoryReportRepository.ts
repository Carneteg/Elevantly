import type { Report, ReportSubjectType } from "./report";
import { isValidReport, normalizeReason } from "./report";
import type { ReportRepository } from "./reportRepository";

/**
 * In-memory-implementation av `ReportRepository`. Per-instans, för tester och
 * lokal utveckling tills Supabase-varianten kopplas in bakom samma interface.
 */
export class InMemoryReportRepository implements ReportRepository {
  private readonly reports: Report[] = [];
  private seq = 0;

  async create(
    reporterId: string,
    subjectType: ReportSubjectType,
    subjectId: string,
    reason: string,
    now: string,
  ): Promise<Report> {
    if (!reporterId) throw new Error("reporterId krävs för en rapport.");
    if (!isValidReport(subjectType, subjectId)) {
      throw new Error("Ogiltig rapport (typ eller objekt saknas).");
    }
    const report: Report = {
      id: `report-${++this.seq}`,
      reporterId,
      subjectType,
      subjectId: subjectId.trim(),
      reason: normalizeReason(reason),
      createdAt: now,
    };
    this.reports.push({ ...report });
    return { ...report };
  }

  async listForReview(limit = 200): Promise<Report[]> {
    return [...this.reports]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  /** Endast för test/granskning: alla lagrade rapporter. */
  all(): Report[] {
    return this.reports.map((r) => ({ ...r }));
  }
}
