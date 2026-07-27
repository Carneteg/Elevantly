import type { SupabaseClient } from "@supabase/supabase-js";
import type { Decision } from "../decision";
import type {
  ProfileRepository,
  ProfileVisibility,
  PublicProfile,
  PublicProfileSummary,
  StoredProfile,
} from "./profile";
import { normalizeHandle } from "./handle";

/**
 * Supabase-backad ProfileRepository. Implementerar samma interface som
 * InMemoryProfileRepository — produktlogiken ser ingen skillnad.
 *
 * Klienten skickas in (injiceras), inte skapas här: den MÅSTE vara knuten till
 * den inloggade användarens session så att row-level security gäller. Repot vet
 * inget om HTTP eller auth — det gör bara CRUD mot `profiles`-tabellen (se
 * `supabase/migrations/`).
 */

const TABLE = "profiles";
const COLUMNS =
  "user_id, decisions, visibility, handle, display_name, headline, created_at, updated_at";
const PUBLIC_COLUMNS = "handle, display_name, headline, decisions";
const SUMMARY_COLUMNS = "user_id, handle, display_name, headline";

/** Radformen i databasen (snake_case, decisions som jsonb). */
interface ProfileRow {
  user_id: string;
  decisions: Decision[];
  visibility: ProfileVisibility;
  handle: string | null;
  display_name: string | null;
  headline: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicRow {
  handle: string;
  display_name: string | null;
  headline: string | null;
  decisions: Decision[];
}

interface SummaryRow {
  user_id: string;
  handle: string;
  display_name: string | null;
  headline: string | null;
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

  async loadPublicProfileByHandle(
    handle: string,
  ): Promise<PublicProfile | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .eq("handle", normalizeHandle(handle))
      .eq("visibility", "public")
      .maybeSingle<PublicRow>();

    if (error) {
      throw new Error(`Kunde inte läsa publik profil: ${error.message}`);
    }
    return data ? publicRowToProfile(data) : null;
  }

  async loadVisibleProfileByHandle(
    handle: string,
  ): Promise<PublicProfile | null> {
    // Ingen synlighetsfilter här — row-level security avgör om betraktaren får se
    // raden (offentlig, `contacts` för en kontakt, eller egen). Se migrationerna.
    const { data, error } = await this.client
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .eq("handle", normalizeHandle(handle))
      .maybeSingle<PublicRow>();

    if (error) {
      throw new Error(`Kunde inte läsa profil: ${error.message}`);
    }
    return data ? publicRowToProfile(data) : null;
  }

  async findUserIdByPublicHandle(handle: string): Promise<string | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("user_id")
      .eq("handle", normalizeHandle(handle))
      .eq("visibility", "public")
      .maybeSingle<{ user_id: string }>();

    if (error) {
      throw new Error(`Kunde inte slå upp handle: ${error.message}`);
    }
    return data ? data.user_id : null;
  }

  async findUserIdByVisibleHandle(handle: string): Promise<string | null> {
    // RLS avgör synligheten — vi filtrerar bara på handle.
    const { data, error } = await this.client
      .from(TABLE)
      .select("user_id")
      .eq("handle", normalizeHandle(handle))
      .maybeSingle<{ user_id: string }>();

    if (error) {
      throw new Error(`Kunde inte slå upp handle: ${error.message}`);
    }
    return data ? data.user_id : null;
  }

  async loadPublicSummariesByIds(
    userIds: string[],
  ): Promise<PublicProfileSummary[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await this.client
      .from(TABLE)
      .select(SUMMARY_COLUMNS)
      .in("user_id", userIds)
      .eq("visibility", "public")
      .not("handle", "is", null)
      .returns<SummaryRow[]>();

    if (error) {
      throw new Error(`Kunde inte läsa profil-sammanfattningar: ${error.message}`);
    }
    return (data ?? []).map(summaryRowToProfile);
  }
}

function rowToProfile(row: ProfileRow): StoredProfile {
  return {
    userId: row.user_id,
    decisions: row.decisions,
    visibility: row.visibility,
    ...(row.handle ? { handle: row.handle } : {}),
    ...(row.display_name ? { displayName: row.display_name } : {}),
    ...(row.headline ? { headline: row.headline } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function profileToRow(profile: StoredProfile): ProfileRow {
  return {
    user_id: profile.userId,
    decisions: profile.decisions,
    visibility: profile.visibility,
    handle: profile.handle ?? null,
    display_name: profile.displayName ?? null,
    headline: profile.headline ?? null,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

function publicRowToProfile(row: PublicRow): PublicProfile {
  return {
    handle: row.handle,
    displayName: row.display_name,
    headline: row.headline,
    decisions: row.decisions,
  };
}

function summaryRowToProfile(row: SummaryRow): PublicProfileSummary {
  return {
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    headline: row.headline,
  };
}
