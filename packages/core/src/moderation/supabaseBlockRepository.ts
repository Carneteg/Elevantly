import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "./block";
import type { BlockRepository } from "./blockRepository";

/**
 * Supabase-backad `BlockRepository`. Klienten injiceras och MÅSTE vara knuten
 * till den inloggade användarens session. Row-level security: man hanterar och
 * ser bara sina EGNA blockeringar (vem man själv blockerat). Den ömsesidiga
 * kontrollen görs via `is_blocked_with` — en `security definer`-funktion som ser
 * båda riktningar men bara svarar för par där den inloggade är en av parterna, så
 * att man inte kan avläsa att man blockerats. Se `supabase/migrations/`.
 */

const TABLE = "blocks";
const COLUMNS = "blocker_id, blocked_id, created_at";

interface BlockRow {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export class SupabaseBlockRepository implements BlockRepository {
  constructor(private readonly client: SupabaseClient) {}

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
    const row: BlockRow = {
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: now,
    };
    const { error } = await this.client
      .from(TABLE)
      .upsert(row, { onConflict: "blocker_id,blocked_id" });

    if (error) throw new Error(`Kunde inte blockera: ${error.message}`);
    return { blockerId, blockedId, createdAt: now };
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);

    if (error) throw new Error(`Kunde inte häva blockering: ${error.message}`);
  }

  async hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("blocker_id")
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId)
      .maybeSingle<{ blocker_id: string }>();

    if (error) throw new Error(`Kunde inte läsa blockering: ${error.message}`);
    return data !== null;
  }

  async isBlockedBetween(userA: string, userB: string): Promise<boolean> {
    // Funktionen använder auth.uid() + `other` internt; en av userA/userB måste
    // vara den inloggade. Vi skickar motparten som den som inte är sessionen —
    // i praktiken anropas detta alltid med den inloggade som userA.
    const { data, error } = await this.client.rpc("is_blocked_with", {
      other: userB === userA ? userA : userB,
    });
    if (error) throw new Error(`Kunde inte kontrollera blockering: ${error.message}`);
    return data === true;
  }

  async listBlocked(blockerId: string): Promise<Block[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("blocker_id", blockerId)
      .returns<BlockRow[]>();

    if (error) throw new Error(`Kunde inte läsa blockeringar: ${error.message}`);
    return (data ?? []).map(rowToBlock);
  }
}

function rowToBlock(row: BlockRow): Block {
  return {
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  };
}
