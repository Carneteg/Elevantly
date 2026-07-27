import type { SupabaseClient } from "@supabase/supabase-js";
import type { Post, PostGrounding } from "./post";
import { isValidPostBody, normalizeGrounding, normalizePostBody } from "./post";
import type { PostRepository } from "./postRepository";

/**
 * Supabase-backad `PostRepository`. Samma interface som in-memory-varianten.
 * Klienten injiceras och MÅSTE vara knuten till den inloggade användarens
 * session, så att row-level security gäller: man ser bara inlägg från sig själv
 * och sina accepterade kontakter, och kan bara skapa/radera egna inlägg. Se
 * `supabase/migrations/`.
 */

const TABLE = "posts";
const COLUMNS = "id, author_id, body, created_at, grounded_in";

interface PostRow {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  grounded_in: PostGrounding | null;
}

export class SupabasePostRepository implements PostRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(
    authorId: string,
    body: string,
    now: string,
    groundedIn?: PostGrounding,
  ): Promise<Post> {
    if (!authorId) throw new Error("authorId krävs för att skapa ett inlägg.");
    if (!isValidPostBody(body)) {
      throw new Error("Ogiltig inläggstext (tom eller för lång).");
    }
    const grounding = normalizeGrounding(groundedIn);
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        author_id: authorId,
        body: normalizePostBody(body),
        created_at: now,
        grounded_in: grounding ?? null,
      })
      .select(COLUMNS)
      .single<PostRow>();

    if (error) throw new Error(`Kunde inte skapa inlägg: ${error.message}`);
    return rowToPost(data);
  }

  async listByAuthors(authorIds: string[], limit = 100): Promise<Post[]> {
    if (authorIds.length === 0) return [];

    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .in("author_id", authorIds)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<PostRow[]>();

    if (error) throw new Error(`Kunde inte läsa flödet: ${error.message}`);
    return (data ?? []).map(rowToPost);
  }

  async delete(id: string, authorId: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq("id", id)
      .eq("author_id", authorId);

    if (error) throw new Error(`Kunde inte ta bort inlägg: ${error.message}`);
  }
}

function rowToPost(row: PostRow): Post {
  const grounding = normalizeGrounding(row.grounded_in ?? undefined);
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    ...(grounding ? { groundedIn: grounding } : {}),
  };
}
