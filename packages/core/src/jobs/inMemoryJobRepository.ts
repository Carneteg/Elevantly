import type { Job, JobInput, JobStatus } from "./job";
import { isValidJobInput } from "./job";
import type { JobRepository } from "./jobRepository";

/**
 * In-memory-implementation av `JobRepository`. Per-instans, för tester och lokal
 * utveckling tills Supabase-varianten kopplas in bakom samma interface. Jobb klonas
 * in och ut så att lagringen inte kan muteras via en referens som lämnat repositoryt.
 */
export class InMemoryJobRepository implements JobRepository {
  private readonly jobs: Job[] = [];
  private seq = 0;

  async create(
    companyId: string,
    companyName: string,
    input: JobInput,
    now: string,
  ): Promise<Job> {
    if (!companyId) throw new Error("companyId krävs för att posta ett jobb.");
    if (!isValidJobInput(input)) {
      throw new Error("Ogiltigt jobb (titel eller obligatoriska krav saknas).");
    }
    const job: Job = {
      id: `job-${++this.seq}`,
      title: input.title.trim(),
      company: companyName,
      summary: input.summary.trim(),
      requiredSkillIds: [...input.requiredSkillIds],
      preferredSkillIds: [...input.preferredSkillIds],
      responsibility: input.responsibility,
      ...(input.location ? { location: input.location } : {}),
      ...(input.remote !== undefined ? { remote: input.remote } : {}),
      companyId,
      status: input.status,
      createdAt: now,
    };
    this.jobs.push(structuredClone(job));
    return structuredClone(job);
  }

  async listByCompany(companyId: string): Promise<Job[]> {
    return this.jobs
      .filter((j) => j.companyId === companyId)
      .sort(byCreatedDesc)
      .map((j) => structuredClone(j));
  }

  async listPublished(limit = 100): Promise<Job[]> {
    return this.jobs
      .filter((j) => j.status === "published")
      .sort(byCreatedDesc)
      .slice(0, limit)
      .map((j) => structuredClone(j));
  }

  async setStatus(id: string, companyId: string, status: JobStatus): Promise<void> {
    const job = this.jobs.find((j) => j.id === id && j.companyId === companyId);
    if (job) job.status = status;
  }
}

function byCreatedDesc(a: Job, b: Job): number {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}
