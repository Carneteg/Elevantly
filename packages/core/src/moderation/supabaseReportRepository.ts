import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report, ReportSubjectType } from "./report";
import { isValidReport, normalizeReason } from "./report";
import type { ReportRepository } from "./reportRepository";

/**
 * Supabase-backad `ReportRepository`. Klienten injiceras och MÅSTE vara knuten
 * till den inloggade användarens session, så att row-level security gäller: man
 * kan bara skapa rapporter i eget namn, och vanliga användare kan inte läsa
 * rapporter (granskning sker med service-role). Se `supabase/migrations/`.
 */

const TABLE = "reports";
const COLUMNS = "id, reporter_id, subject_type, subject_id, reason, created_at";

interface ReportRow {
  id: string;
  reporter_id: string;
  subject_type: ReportSubjectType;
  subject_id: string;
  reason: string;
  created_at: string;
}

export class SupabaseReportRepository implements ReportRepository {
  constructor(private readonly client: SupabaseClient) {}

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
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        reporter_id: reporterId,
        subject_type: subjectType,
        subject_id: subjectId.trim(),
        reason: normalizeReason(reason),
        created_at: now,
      })
      .select(COLUMNS)
      .single<ReportRow>();

    if (error) throw new Error(`Kunde inte skapa rapport: ${error.message}`);
    return rowToReport(data);
  }

  async listForReview(limit = 200): Promise<Report[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<ReportRow[]>();

    if (error) throw new Error(`Kunde inte läsa rapporter: ${error.message}`);
    return (data ?? []).map(rowToReport);
  }
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}
