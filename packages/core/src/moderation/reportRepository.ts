import type { Report, ReportSubjectType } from "./report";

/**
 * Lagring av rapporter — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4). Rapporter skrivs av vem som helst (för eget namn) men läses
 * bara av granskare (service-role/admin) — inte av vanliga användare. Se
 * `supabase/migrations/`.
 */
export interface ReportRepository {
  /** Skapar en rapport från `reporterId`. Returnerar den skapade rapporten. */
  create(
    reporterId: string,
    subjectType: ReportSubjectType,
    subjectId: string,
    reason: string,
    now: string,
  ): Promise<Report>;

  /**
   * Granskningskön: rapporter nyast först, begränsat till `limit`. Endast för
   * granskare — i Supabase-varianten gäller RLS så att bara en admin når något
   * (via `is_admin()`); vanliga användare får en tom lista. Se `supabase/migrations/`.
   */
  listForReview(limit?: number): Promise<Report[]>;
}
