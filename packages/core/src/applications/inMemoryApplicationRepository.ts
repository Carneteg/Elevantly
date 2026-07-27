import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
} from "./application";
import { normalizeApplicationMessage } from "./application";
import type { ApplicationRepository } from "./applicationRepository";

/**
 * In-memory-implementation av `ApplicationRepository`. Per-instans, för tester och
 * lokal utveckling tills Supabase-varianten kopplas in bakom samma interface.
 * Ansökningar klonas in och ut så att lagringen inte kan muteras via en referens
 * som lämnat repositoryt. En kandidat kan söka ett jobb en gång.
 */
export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly applications: Application[] = [];
  private seq = 0;

  async apply(
    jobId: string,
    companyId: string,
    candidateId: string,
    input: ApplicationInput,
    now: string,
  ): Promise<Application> {
    if (!jobId || !companyId || !candidateId) {
      throw new Error("jobId, companyId och candidateId krävs för en ansökan.");
    }
    if (
      this.applications.some(
        (a) => a.jobId === jobId && a.candidateId === candidateId,
      )
    ) {
      throw new Error("Du har redan sökt det här jobbet.");
    }
    const message = normalizeApplicationMessage(input.message);
    const application: Application = {
      id: `application-${++this.seq}`,
      jobId,
      companyId,
      ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
      ...(input.companyName ? { companyName: input.companyName } : {}),
      candidateId,
      ...(input.candidateName ? { candidateName: input.candidateName } : {}),
      ...(input.candidateHeadline
        ? { candidateHeadline: input.candidateHeadline }
        : {}),
      decisions: structuredClone(input.decisions),
      ...(message ? { message } : {}),
      status: "submitted",
      createdAt: now,
    };
    this.applications.push(structuredClone(application));
    return structuredClone(application);
  }

  async listForCandidate(candidateId: string): Promise<Application[]> {
    return this.applications
      .filter((a) => a.candidateId === candidateId)
      .sort(byCreatedDesc)
      .map((a) => structuredClone(a));
  }

  async listForJob(jobId: string): Promise<Application[]> {
    return this.applications
      .filter((a) => a.jobId === jobId)
      .sort(byCreatedDesc)
      .map((a) => structuredClone(a));
  }

  async setStatus(id: string, status: ApplicationStatus): Promise<void> {
    const application = this.applications.find((a) => a.id === id);
    if (application) application.status = status;
  }
}

function byCreatedDesc(a: Application, b: Application): number {
  return b.createdAt.localeCompare(a.createdAt);
}
