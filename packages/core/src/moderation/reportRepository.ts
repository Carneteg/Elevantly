import type { Report, ReportStatus, ReportSubjectType } from "./report";

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
   * Granskningskön: ÖPPNA rapporter nyast först, begränsat till `limit`. Endast
   * för granskare — i Supabase-varianten gäller RLS så att bara en admin når något
   * (via `is_admin()`); vanliga användare får en tom lista. Åtgärdade/avvisade
   * rapporter faller ur kön. Se `supabase/migrations/`.
   */
  listForReview(limit?: number): Promise<Report[]>;

  /**
   * Sätter en rapports status (granskarens beslut). `adminId` är granskaren som
   * fattar beslutet; `now` tidsstämplar det. Att sätta något annat än `open`
   * markerar rapporten som avförd ur kön. Endast granskare (RLS).
   */
  setStatus(
    id: string,
    status: ReportStatus,
    adminId: string,
    now: string,
  ): Promise<void>;
}
