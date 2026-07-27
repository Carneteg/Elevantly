/**
 * Trust & safety — rapportering. Ett socialt lager kräver missbruksskydd från
 * start; förtroende är produkten (CLAUDE.md 11, roadmap "trust & safety"). Detta
 * är den första bricken: en användare kan flagga innehåll eller en profil för
 * granskning. Ingen automatisk åtgärd — signalen fångas för mänsklig granskning.
 */

/** Vad en rapport gäller. */
export type ReportSubjectType = "profile" | "post" | "message";

/**
 * Var en rapport står i granskningen. `open` = väntar på beslut (kön), `resolved`
 * = åtgärdad, `dismissed` = avvisad (ingen åtgärd behövs). Ingen automatik avgör
 * detta — en granskare sätter det (CLAUDE.md 11: förtroende är produkten).
 */
export type ReportStatus = "open" | "resolved" | "dismissed";

const STATUSES: ReportStatus[] = ["open", "resolved", "dismissed"];

/** Är värdet en giltig rapportstatus? */
export function isReportStatus(value: string): value is ReportStatus {
  return (STATUSES as string[]).includes(value);
}

/** En rapport: vem som flaggade vad, varför, och var den står i granskningen. */
export interface Report {
  /** Stabilt id (sätts av lagret/databasen). */
  id: string;
  /** Vem som rapporterade (userId). */
  reporterId: string;
  /** Typ av objekt som rapporteras. */
  subjectType: ReportSubjectType;
  /** Identifierare för objektet (t.ex. handle, post-id) — tolkas per typ. */
  subjectId: string;
  /** Fritext-motivering (valfri men rekommenderad). */
  reason: string;
  /** När rapporten skapades (ISO 8601). */
  createdAt: string;
  /** Var rapporten står i granskningen. Ny rapport börjar som `open`. */
  status: ReportStatus;
  /** Granskaren som senast satte status (userId), eller `null` medan `open`. */
  resolvedBy: string | null;
  /** När status senast sattes bort från `open` (ISO 8601), eller `null`. */
  resolvedAt: string | null;
}

/** Övre gräns på motiveringens längd — dataminimering. */
export const MAX_REPORT_REASON = 1000;

const SUBJECT_TYPES: ReportSubjectType[] = ["profile", "post", "message"];

/** Är typen en giltig rapporttyp? */
export function isReportSubjectType(value: string): value is ReportSubjectType {
  return (SUBJECT_TYPES as string[]).includes(value);
}

/** Trimmad motivering, kapad till gränsen. */
export function normalizeReason(reason: string): string {
  return reason.trim().slice(0, MAX_REPORT_REASON);
}

/**
 * Är rapporten giltig att skapa? Kräver giltig typ och ett icke-tomt subjectId.
 * Motiveringen är valfri (men fångas när den finns).
 */
export function isValidReport(subjectType: string, subjectId: string): boolean {
  return isReportSubjectType(subjectType) && subjectId.trim().length > 0;
}
