import type { Role } from "./role";

/**
 * Källan till rollarketyper — abstraherad bakom ett interface, precis som övriga
 * lager (CLAUDE.md 8.4). Matchningslogiken beror bara på detta interface, aldrig
 * på var rollerna kommer ifrån. v1: `StaticRoleCatalog` (kurerat i repot). Senare:
 * en extern taxonomi (ESCO/SSYK) kan kopplas in utan att röra produktlogiken.
 */
export interface RoleCatalog {
  /** Alla tillgängliga rollarketyper. */
  list(): Promise<Role[]>;
}
