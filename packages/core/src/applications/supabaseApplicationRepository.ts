import type { SupabaseClient } from "@supabase/supabase-js";
import type { Decision } from "../decision";
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
} from "./application";
import { normalizeApplicationMessage } from "./application";
import type { ApplicationRepository } from "./applicationRepository";

/**
 * Supabase-backad `ApplicationRepository`. Samma interface som in-memory-varianten.
 * Klienten injiceras och MÅSTE vara knuten till den inloggade sessionen så att
 * row-level security gäller: kandidaten ser sina egna ansökningar, företagets
 * medlemmar ser ansökningar till företagets jobb, och man söker som sig själv på ett
 * publicerat jobb (`candidate_id` sätts av DB-default `auth.uid()`). Se `supabase/migrations/`.
 */

const TABLE = "applications";
const COLUMNS =
  "id, job_id, company_id, job_title, company, candidate_id, candidate_name, candidate_headline, decisions, message, status, created_at";

interface ApplicationRow {
  id: string;
  job_id: string;
  company_id: string;
  job_title: string | null;
  company: string | null;
  candidate_id: string;
  candidate_name: string | null;
  candidate_headline: string | null;
  decisions: Decision[];
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async apply(
    jobId: string,
    companyId: string,
    _candidateId: string,
    input: ApplicationInput,
    _now: string,
  ): Promise<Application> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        job_id: jobId,
        company_id: companyId,
        job_title: input.jobTitle ?? null,
        company: input.companyName ?? null,
        candidate_name: input.candidateName ?? null,
        candidate_headline: input.candidateHeadline ?? null,
        decisions: input.decisions,
        message: normalizeApplicationMessage(input.message) ?? null,
        status: "submitted",
      })
      .select(COLUMNS)
      .single<ApplicationRow>();

    if (error) {
      if (error.code === "23505" || /duplicate key/i.test(error.message)) {
        throw new Error("Du har redan sökt det här jobbet.");
      }
      throw new Error(`Kunde inte skicka ansökan: ${error.message}`);
    }
    return rowToApplication(data);
  }

  async listForCandidate(_candidateId: string): Promise<Application[]> {
    // RLS returnerar bara den inloggades egna ansökningar — inget filter behövs.
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .returns<ApplicationRow[]>();

    if (error) throw new Error(`Kunde inte läsa ansökningar: ${error.message}`);
    return (data ?? []).map(rowToApplication);
  }

  async listForJob(jobId: string): Promise<Application[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .returns<ApplicationRow[]>();

    if (error) throw new Error(`Kunde inte läsa ansökningar: ${error.message}`);
    return (data ?? []).map(rowToApplication);
  }

  async setStatus(id: string, status: ApplicationStatus): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(`Kunde inte uppdatera ansökan: ${error.message}`);
  }
}

function rowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    companyId: row.company_id,
    ...(row.job_title ? { jobTitle: row.job_title } : {}),
    ...(row.company ? { companyName: row.company } : {}),
    candidateId: row.candidate_id,
    ...(row.candidate_name ? { candidateName: row.candidate_name } : {}),
    ...(row.candidate_headline
      ? { candidateHeadline: row.candidate_headline }
      : {}),
    decisions: row.decisions ?? [],
    ...(row.message ? { message: row.message } : {}),
    status: row.status,
    createdAt: row.created_at,
  };
}
