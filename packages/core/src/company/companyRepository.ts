import type { Company } from "./company";

/**
 * Lagring av företag — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4). Rent id-baserat gränssnitt utan kunskap om HTTP, React eller en
 * specifik databas. Supabase-varianten skapar företag + första medlemskap atomiskt
 * (via en `security definer`-funktion) och styr åtkomst med row-level security:
 * bara medlemmar ser och hanterar sitt företag.
 */
export interface CompanyRepository {
  /**
   * Skapar ett företag och gör `ownerId` till dess första medlem. Självbetjänat —
   * vilken inloggad användare som helst får skapa ett företag. Returnerar det skapade.
   * (I Supabase-varianten avgör den inloggade sessionen ägaren; RLS är spärren.)
   */
  create(
    ownerId: string,
    name: string,
    now: string,
    summary?: string,
  ): Promise<Company>;

  /** Hämtar ett företag via id om betraktaren får se det (medlem), annars `null`. */
  load(id: string): Promise<Company | null>;

  /** Företag som `userId` är medlem i. */
  listForUser(userId: string): Promise<Company[]>;
}
