import type { Message } from "./message";

/**
 * Lagring av meddelanden — samma abstraktionsmönster som övriga repositories
 * (CLAUDE.md 8.4). Rent gränssnitt utan kunskap om HTTP, React eller en specifik
 * databas. Implementationer: `InMemoryMessageRepository` och
 * `SupabaseMessageRepository` (med row-level security så att bara avsändare och
 * mottagare ser ett meddelande, och man bara kan skriva till accepterade kontakter).
 */
export interface MessageRepository {
  /** Skickar ett meddelande från `senderId` till `recipientId`. Returnerar det skapade. */
  send(
    senderId: string,
    recipientId: string,
    body: string,
    now: string,
  ): Promise<Message>;

  /**
   * Konversationstråden mellan två användare (endera riktning), äldst först,
   * begränsad till `limit`.
   */
  listThread(userA: string, userB: string, limit?: number): Promise<Message[]>;

  /**
   * ALLA meddelanden som `userId` ingår i (skickade eller mottagna), äldst först.
   * För dataexport (GDPR, CLAUDE.md 9.2): användaren ska kunna se allt som rör dem.
   */
  listAllForUser(userId: string): Promise<Message[]>;
}
