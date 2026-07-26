import type { SupabaseClient } from "@supabase/supabase-js";
import type { Decision } from "../decision";
import type { ProfileRepository, StoredProfile } from "./profile";

/**
 * Supabase-backad ProfileRepository. Implementerar samma interface som
 * InMemoryProfileRepository — produktlogiken ser ingen skillnad.
 *
 * Klienten skickas in (injiceras), inte skapas här: den MÅSTE vara knuten till
 * den inloggade användarens session så att row-level security gäller. Repot vet
 * inget om HTTP eller auth — det gör bara CRUD mot `profiles`-tabellen (se
 * `supabase/migrations/0001_profiles.sql`).
 */

const TABLE = "profiles";
const COLUMNS = "user_id, decisions, created_at, updated_at";

/** Radformen i databasen (snake_case, decisions som jsonb). */
interface ProfileRow {
  user_id: string;
  decisions: Decision[];
  created_at: string;
  updated_at: string;
}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: string): Promise<StoredProfile | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();

    if (error) throw new Error(`Kunde inte läsa profil: ${error.message}`);
    return data ? rowToProfile(data) : null;
  }

  async save(profile: StoredProfile): Promise<void> {
    if (!profile.userId) {
      throw new Error("StoredProfile.userId får inte vara tomt.");
    }
    const { error } = await this.client
      .from(TABLE)
      .upsert(profileToRow(profile), { onConflict: "user_id" });

    if (error) throw new Error(`Kunde inte spara profil: ${error.message}`);
  }

  async delete(userId: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq("user_id", userId);

    if (error) throw new Error(`Kunde inte radera profil: ${error.message}`);
  }
}

function rowToProfile(row: ProfileRow): StoredProfile {
  return {
    userId: row.user_id,
    decisions: row.decisions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function profileToRow(profile: StoredProfile): ProfileRow {
  return {
    user_id: profile.userId,
    decisions: profile.decisions,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}
