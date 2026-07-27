import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company } from "./company";
import {
  isValidCompanyName,
  normalizeCompanyName,
  normalizeCompanySummary,
} from "./company";
import type { CompanyRepository } from "./companyRepository";

/**
 * Supabase-backad `CompanyRepository`. Samma interface som in-memory-varianten.
 * Klienten injiceras och MÅSTE vara knuten till den inloggade sessionen, så att
 * row-level security gäller: bara medlemmar ser och hanterar sitt företag. Att
 * skapa ett företag går via `create_company` (security definer) som atomiskt lägger
 * företaget OCH det första medlemskapet — undviker bootstrap-problemet i RLS och
 * sätter ägaren till `auth.uid()`. Se `supabase/migrations/`.
 */

const TABLE = "companies";
const COLUMNS = "id, name, summary, created_by, created_at";

interface CompanyRow {
  id: string;
  name: string;
  summary: string | null;
  created_by: string;
  created_at: string;
}

export class SupabaseCompanyRepository implements CompanyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(
    _ownerId: string,
    name: string,
    _now: string,
    summary?: string,
  ): Promise<Company> {
    if (!isValidCompanyName(name)) {
      throw new Error("Ogiltigt företagsnamn (tomt eller för långt).");
    }
    // Ägaren avgörs av sessionen (auth.uid()) i funktionen, inte av parametern.
    const { data, error } = await this.client.rpc("create_company", {
      p_name: normalizeCompanyName(name),
      p_summary: normalizeCompanySummary(summary) ?? null,
    });
    if (error) throw new Error(`Kunde inte skapa företag: ${error.message}`);

    const id = data as string;
    const company = await this.load(id);
    if (!company) {
      throw new Error("Företaget skapades men kunde inte läsas tillbaka.");
    }
    return company;
  }

  async load(id: string): Promise<Company | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle<CompanyRow>();

    if (error) throw new Error(`Kunde inte läsa företag: ${error.message}`);
    return data ? rowToCompany(data) : null;
  }

  async listForUser(_userId: string): Promise<Company[]> {
    // RLS returnerar bara företag där den inloggade är medlem — inget filter behövs.
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .returns<CompanyRow[]>();

    if (error) throw new Error(`Kunde inte läsa företag: ${error.message}`);
    return (data ?? []).map(rowToCompany);
  }
}

function rowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    ...(row.summary ? { summary: row.summary } : {}),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
