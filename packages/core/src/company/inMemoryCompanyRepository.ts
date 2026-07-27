import type { Company } from "./company";
import {
  isValidCompanyName,
  normalizeCompanyName,
  normalizeCompanySummary,
} from "./company";
import type { CompanyRepository } from "./companyRepository";

/**
 * In-memory-implementation av `CompanyRepository`. Per-instans, för tester och lokal
 * utveckling tills Supabase-varianten kopplas in bakom samma interface. Speglar
 * företag + medlemskap (par company↔user). Företag klonas in och ut så att lagringen
 * inte kan muteras via en referens som lämnat repositoryt.
 */
export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies = new Map<string, Company>();
  private readonly memberships = new Set<string>(); // `${companyId}:${userId}`
  private seq = 0;

  async create(
    ownerId: string,
    name: string,
    now: string,
    summary?: string,
  ): Promise<Company> {
    if (!ownerId) throw new Error("ownerId krävs för att skapa ett företag.");
    if (!isValidCompanyName(name)) {
      throw new Error("Ogiltigt företagsnamn (tomt eller för långt).");
    }
    const normalizedSummary = normalizeCompanySummary(summary);
    const company: Company = {
      id: `company-${++this.seq}`,
      name: normalizeCompanyName(name),
      ...(normalizedSummary ? { summary: normalizedSummary } : {}),
      createdBy: ownerId,
      createdAt: now,
    };
    this.companies.set(company.id, structuredClone(company));
    this.memberships.add(`${company.id}:${ownerId}`);
    return structuredClone(company);
  }

  async load(id: string): Promise<Company | null> {
    const company = this.companies.get(id);
    return company ? structuredClone(company) : null;
  }

  async listForUser(userId: string): Promise<Company[]> {
    const result: Company[] = [];
    for (const company of this.companies.values()) {
      if (this.memberships.has(`${company.id}:${userId}`)) {
        result.push(structuredClone(company));
      }
    }
    return result;
  }
}
