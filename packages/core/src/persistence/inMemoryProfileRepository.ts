import type {
  ProfileRepository,
  PublicProfile,
  PublicProfileSummary,
  StoredProfile,
} from "./profile";
import { normalizeHandle } from "./handle";

/**
 * In-memory-implementation av ProfileRepository.
 *
 * OBS: tillståndet lever i processens minne — det är **per-instans** och
 * **överlever inte en omstart**. Avsett för lokal utveckling och tester tills en
 * Supabase-backad variant kopplas in bakom samma interface. Använd inte som
 * varaktig lagring i drift.
 *
 * Profiler klonas in och ut så att lagringen inte kan muteras av misstag via en
 * referens som lämnat repositoryt.
 */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly store = new Map<string, StoredProfile>();

  async load(userId: string): Promise<StoredProfile | null> {
    const profile = this.store.get(userId);
    return profile ? clone(profile) : null;
  }

  async save(profile: StoredProfile): Promise<void> {
    if (!profile.userId) {
      throw new Error("StoredProfile.userId får inte vara tomt.");
    }
    this.store.set(profile.userId, clone(profile));
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }

  async loadPublicProfileByHandle(
    handle: string,
  ): Promise<PublicProfile | null> {
    const wanted = normalizeHandle(handle);
    for (const profile of this.store.values()) {
      if (
        profile.visibility === "public" &&
        profile.handle &&
        normalizeHandle(profile.handle) === wanted
      ) {
        return {
          handle: profile.handle,
          displayName: profile.displayName ?? null,
          headline: profile.headline ?? null,
          decisions: structuredClone(profile.decisions),
        };
      }
    }
    return null;
  }

  /**
   * OBS: in-memory-varianten kan inte känna till kontaktrelationer (den vet inget
   * om kopplingar). Den approximerar därför "synlig" som "inte privat" — och
   * upprätthåller INTE `contacts`-kontrollen. I drift är det row-level security i
   * Supabase-varianten som avgör om en betraktare faktiskt är en kontakt.
   */
  async loadVisibleProfileByHandle(
    handle: string,
  ): Promise<PublicProfile | null> {
    const wanted = normalizeHandle(handle);
    for (const profile of this.store.values()) {
      if (
        profile.visibility !== "private" &&
        profile.handle &&
        normalizeHandle(profile.handle) === wanted
      ) {
        return {
          handle: profile.handle,
          displayName: profile.displayName ?? null,
          headline: profile.headline ?? null,
          decisions: structuredClone(profile.decisions),
        };
      }
    }
    return null;
  }

  async findUserIdByPublicHandle(handle: string): Promise<string | null> {
    const wanted = normalizeHandle(handle);
    for (const profile of this.store.values()) {
      if (
        profile.visibility === "public" &&
        profile.handle &&
        normalizeHandle(profile.handle) === wanted
      ) {
        return profile.userId;
      }
    }
    return null;
  }

  /** Se `loadVisibleProfileByHandle` — samma approximation (inte privat). */
  async findUserIdByVisibleHandle(handle: string): Promise<string | null> {
    const wanted = normalizeHandle(handle);
    for (const profile of this.store.values()) {
      if (
        profile.visibility !== "private" &&
        profile.handle &&
        normalizeHandle(profile.handle) === wanted
      ) {
        return profile.userId;
      }
    }
    return null;
  }

  async loadPublicSummariesByIds(
    userIds: string[],
  ): Promise<PublicProfileSummary[]> {
    const wanted = new Set(userIds);
    const summaries: PublicProfileSummary[] = [];
    for (const profile of this.store.values()) {
      if (
        wanted.has(profile.userId) &&
        profile.visibility === "public" &&
        profile.handle
      ) {
        summaries.push({
          userId: profile.userId,
          handle: profile.handle,
          displayName: profile.displayName ?? null,
          headline: profile.headline ?? null,
        });
      }
    }
    return summaries;
  }
}

function clone(profile: StoredProfile): StoredProfile {
  return structuredClone(profile);
}
