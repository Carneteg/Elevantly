import type { Block } from "./block";

/**
 * Lagring av blockeringar — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4).
 *
 * Två slags uppslag med olika synlighet:
 * - `hasBlocked` är RIKTAT (blockerade JAG den här personen?) — läsbart för
 *   blockeraren, driver knappens tillstånd.
 * - `isBlockedBetween` är ÖMSESIDIGT (finns blockering i någon riktning?) — driver
 *   upprätthållandet. I Supabase-varianten sker det via en `security definer`-
 *   funktion så att man inte kan avläsa att någon blockerat en (integritet).
 */
export interface BlockRepository {
  /** Blockerar `blockedId`. Idempotent. */
  block(blockerId: string, blockedId: string, now: string): Promise<Block>;

  /** Häver en blockering. */
  unblock(blockerId: string, blockedId: string): Promise<void>;

  /** Har `blockerId` blockerat `blockedId`? (Riktat.) */
  hasBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  /**
   * Finns en blockering mellan de två användarna i NÅGON riktning? Driver
   * upprätthållandet (t.ex. blockera meddelanden/förfrågningar). I Supabase krävs
   * att den ena parten är den inloggade användaren (integritetsbevarande).
   */
  isBlockedBetween(userA: string, userB: string): Promise<boolean>;

  /** Alla som `blockerId` har blockerat. */
  listBlocked(blockerId: string): Promise<Block[]>;
}
