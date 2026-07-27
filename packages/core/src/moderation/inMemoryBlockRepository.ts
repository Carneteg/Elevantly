import type { Block } from "./block";
import type { BlockRepository } from "./blockRepository";

/**
 * In-memory-implementation av `BlockRepository`. Per-instans, för tester och
 * lokal utveckling tills Supabase-varianten kopplas in bakom samma interface.
 */
export class InMemoryBlockRepository implements BlockRepository {
  private readonly blocks: Block[] = [];

  async block(
    blockerId: string,
    blockedId: string,
    now: string,
  ): Promise<Block> {
    if (!blockerId || !blockedId) {
      throw new Error("Både blockerare och blockerad krävs.");
    }
    if (blockerId === blockedId) {
      throw new Error("Kan inte blockera sig själv.");
    }
    const existing = this.blocks.find(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId,
    );
    if (existing) return { ...existing };

    const block: Block = { blockerId, blockedId, createdAt: now };
    this.blocks.push({ ...block });
    return { ...block };
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const index = this.blocks.findIndex(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId,
    );
    if (index >= 0) this.blocks.splice(index, 1);
  }

  async hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    return this.blocks.some(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId,
    );
  }

  async isBlockedBetween(userA: string, userB: string): Promise<boolean> {
    return this.blocks.some(
      (b) =>
        (b.blockerId === userA && b.blockedId === userB) ||
        (b.blockerId === userB && b.blockedId === userA),
    );
  }

  async listBlocked(blockerId: string): Promise<Block[]> {
    return this.blocks
      .filter((b) => b.blockerId === blockerId)
      .map((b) => ({ ...b }));
  }
}
