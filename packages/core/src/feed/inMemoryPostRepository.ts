import type { Post, PostGrounding } from "./post";
import {
  isValidPostBody,
  normalizeGrounding,
  normalizePostBody,
  orderFeed,
} from "./post";
import type { PostRepository } from "./postRepository";

/**
 * In-memory-implementation av `PostRepository`. Per-instans, överlever inte en
 * omstart — avsedd för tester och lokal utveckling tills Supabase-varianten
 * kopplas in bakom samma interface. Inlägg klonas in och ut så att lagringen
 * inte kan muteras via en referens som lämnat repositoryt.
 */
export class InMemoryPostRepository implements PostRepository {
  private readonly posts: Post[] = [];
  private seq = 0;

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
    const post: Post = {
      id: `post-${++this.seq}`,
      authorId,
      body: normalizePostBody(body),
      createdAt: now,
      ...(grounding ? { groundedIn: grounding } : {}),
    };
    this.posts.push(structuredClone(post));
    return structuredClone(post);
  }

  async listByAuthors(authorIds: string[], limit = 100): Promise<Post[]> {
    const wanted = new Set(authorIds);
    return orderFeed(this.posts.filter((p) => wanted.has(p.authorId)))
      .slice(0, limit)
      .map((p) => structuredClone(p));
  }

  async delete(id: string, authorId: string): Promise<void> {
    const index = this.posts.findIndex(
      (p) => p.id === id && p.authorId === authorId,
    );
    if (index >= 0) this.posts.splice(index, 1);
  }
}
