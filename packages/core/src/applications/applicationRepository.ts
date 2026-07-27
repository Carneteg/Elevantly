import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
} from "./application";

/**
 * Lagring av ansökningar — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4). I Supabase gäller row-level security: kandidaten ser sina egna
 * ansökningar, och ett företags medlemmar ser ansökningar till företagets jobb. En
 * kandidat kan söka ett jobb en gång. Se `supabase/migrations/`.
 */
export interface ApplicationRepository {
  /**
   * Skickar en ansökan från `candidateId` på `jobId` (hos `companyId`). `input`
   * bär den samtyckta ögonblicksbilden av kandidatens grundade profil. Returnerar
   * den skapade ansökan.
   */
  apply(
    jobId: string,
    companyId: string,
    candidateId: string,
    input: ApplicationInput,
    now: string,
  ): Promise<Application>;

  /** Kandidatens egna ansökningar, nyast först. */
  listForCandidate(candidateId: string): Promise<Application[]>;

  /** Ansökningar till ett jobb (för arbetsgivaren — företagets medlemmar), nyast först. */
  listForJob(jobId: string): Promise<Application[]>;

  /** Sätter status på en ansökan (arbetsgivarens beslut) — bara företagets medlemmar (RLS). */
  setStatus(id: string, status: ApplicationStatus): Promise<void>;
}
