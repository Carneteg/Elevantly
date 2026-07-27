import type { Job } from "./job";

/**
 * Källan till jobbannonser — abstraherad bakom ett interface (CLAUDE.md 8.4).
 * v1: `StaticJobCatalog` (seedade annonser i repot) så kandidatvärdet finns från
 * dag ett, innan arbetsgivarkonton byggs (CLAUDE.md 6.2). Senare: en Supabase-backad
 * variant där riktiga arbetsgivare publicerar jobb, bakom samma interface.
 */
export interface JobCatalog {
  /** Alla tillgängliga jobbannonser. */
  list(): Promise<Job[]>;
}
