import type { Job, JobInput, JobStatus } from "./job";

/**
 * Lagring av jobbannonser som ett företag postar och hanterar — samma
 * abstraktionsmönster som övriga repositories (CLAUDE.md 8.4). Skilt från den
 * read-only `JobCatalog` (seedade jobb): detta är skriv-/hanteringssidan. I Supabase
 * gäller row-level security: bara ett företags medlemmar skapar/ändrar dess jobb,
 * och alla inloggade ser PUBLICERADE jobb. Se `supabase/migrations/`.
 */
export interface JobRepository {
  /**
   * Skapar ett jobb för `companyId`. `companyName` denormaliseras in på annonsen
   * (visningsnamn) så `/jobs` kan visa arbetsgivaren utan att läsa företagstabellen
   * (som är medlems-skyddad). Returnerar det skapade jobbet.
   */
  create(
    companyId: string,
    companyName: string,
    input: JobInput,
    now: string,
  ): Promise<Job>;

  /** Alla jobb för ett företag, oavsett status (för arbetsgivarvyn), nyast först. */
  listByCompany(companyId: string): Promise<Job[]>;

  /** Publicerade jobb (för kandidatsidan `/jobs`), nyast först, begränsat till `limit`. */
  listPublished(limit?: number): Promise<Job[]>;

  /** Sätter status på ett jobb — bara ett företags medlemmar (RLS). */
  setStatus(id: string, companyId: string, status: JobStatus): Promise<void>;
}
