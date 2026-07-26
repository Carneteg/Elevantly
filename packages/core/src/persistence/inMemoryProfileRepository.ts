import type { ProfileRepository, StoredProfile } from "./profile";

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
}

function clone(profile: StoredProfile): StoredProfile {
  return structuredClone(profile);
}
