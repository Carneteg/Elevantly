import type { Post, PostGrounding } from "./post";

/**
 * Lagring av flödesinlägg — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4). Rent gränssnitt utan kunskap om HTTP, React eller en specifik
 * databas. Implementationer: `InMemoryPostRepository` och `SupabasePostRepository`
 * (med row-level security så att man bara ser inlägg från sig själv och sina
 * accepterade kontakter).
 *
 * Repot känner INTE till kontakter: vilka författare som ingår i ett flöde
 * bestäms av anroparen (self + accepterade kontakter) och skickas in som
 * `authorIds`. Det håller flödeslagret frikopplat från relationslagret.
 */
export interface PostRepository {
  /**
   * Skapar ett inlägg av `authorId`. Returnerar det skapade inlägget (med id).
   * `groundedIn` (valfritt) knyter inlägget till ett av författarens egna beslut —
   * anroparen ansvarar för att grunden är validerad (server-sidan).
   */
  create(
    authorId: string,
    body: string,
    now: string,
    groundedIn?: PostGrounding,
  ): Promise<Post>;

  /**
   * Inlägg från en uppsättning författare, nyast först, begränsat till `limit`.
   * Anroparen skickar in vilka författare som ingår (self + accepterade kontakter).
   */
  listByAuthors(authorIds: string[], limit?: number): Promise<Post[]>;

  /** Tar bort ett eget inlägg (matchar både id och författare). */
  delete(id: string, authorId: string): Promise<void>;
}
