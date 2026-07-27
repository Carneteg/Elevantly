import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResponsibilityLevel } from "../decision";
import type { Job, JobInput, JobStatus } from "./job";
import { isValidJobInput } from "./job";
import type { JobRepository } from "./jobRepository";

/**
 * Supabase-backad `JobRepository`. Samma interface som in-memory-varianten. Klienten
 * injiceras och MÅSTE vara knuten till den inloggade sessionen så att row-level
 * security gäller: bara ett företags medlemmar skapar/ändrar dess jobb, och alla
 * inloggade ser publicerade jobb (`created_by` sätts av DB-default `auth.uid()`).
 * Se `supabase/migrations/`.
 */

const TABLE = "jobs";
const COLUMNS =
  "id, company_id, company, title, summary, required_skill_ids, preferred_skill_ids, responsibility, location, remote, status, created_at";

interface JobRow {
  id: string;
  company_id: string;
  company: string;
  title: string;
  summary: string;
  required_skill_ids: string[];
  preferred_skill_ids: string[];
  responsibility: ResponsibilityLevel;
  location: string | null;
  remote: boolean | null;
  status: JobStatus;
  created_at: string;
}

export class SupabaseJobRepository implements JobRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(
    companyId: string,
    companyName: string,
    input: JobInput,
    _now: string,
  ): Promise<Job> {
    if (!isValidJobInput(input)) {
      throw new Error("Ogiltigt jobb (titel eller obligatoriska krav saknas).");
    }
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        company_id: companyId,
        company: companyName,
        title: input.title.trim(),
        summary: input.summary.trim(),
        required_skill_ids: input.requiredSkillIds,
        preferred_skill_ids: input.preferredSkillIds,
        responsibility: input.responsibility,
        location: input.location ?? null,
        remote: input.remote ?? null,
        status: input.status,
      })
      .select(COLUMNS)
      .single<JobRow>();

    if (error) throw new Error(`Kunde inte skapa jobb: ${error.message}`);
    return rowToJob(data);
  }

  async listByCompany(companyId: string): Promise<Job[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .returns<JobRow[]>();

    if (error) throw new Error(`Kunde inte läsa företagets jobb: ${error.message}`);
    return (data ?? []).map(rowToJob);
  }

  async listPublished(limit = 100): Promise<Job[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<JobRow[]>();

    if (error) throw new Error(`Kunde inte läsa jobb: ${error.message}`);
    return (data ?? []).map(rowToJob);
  }

  async setStatus(id: string, companyId: string, status: JobStatus): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ status })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw new Error(`Kunde inte uppdatera jobbet: ${error.message}`);
  }
}

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    summary: row.summary,
    requiredSkillIds: row.required_skill_ids ?? [],
    preferredSkillIds: row.preferred_skill_ids ?? [],
    responsibility: row.responsibility,
    ...(row.location ? { location: row.location } : {}),
    ...(row.remote !== null ? { remote: row.remote } : {}),
    companyId: row.company_id,
    status: row.status,
    createdAt: row.created_at,
  };
}
