import type { Connection } from "./connection";

/**
 * Lagring av kopplingar — samma abstraktionsmönster som `ProfileRepository`
 * (CLAUDE.md 8.4). Rent id-baserat gränssnitt: ingen kunskap om HTTP, React
 * eller en specifik databas. Implementationer: `InMemoryConnectionRepository`
 * och `SupabaseConnectionRepository` (med row-level security så att bara
 * parterna når en kopplingsrad).
 *
 * Alla metoder som identifierar en koppling gör det via de två userId:na, i
 * vilken ordning som helst — paret är oordnat (en post per relation).
 */
export interface ConnectionRepository {
  /** Kopplingen mellan två användare (endera riktning), eller `null`. */
  findBetween(userA: string, userB: string): Promise<Connection | null>;

  /**
   * Skapar en `pending`-förfrågan från `requesterId` till `addresseeId`.
   * Returnerar den skapade kopplingen. Ska avvisa självförfrågan och dubbletter
   * (lagret/DB upprätthåller en post per par).
   */
  request(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<Connection>;

  /**
   * Accepterar en väntande förfrågan. Endast mottagaren (`addresseeId`) kan
   * acceptera — RLS upprätthåller det i drift.
   */
  accept(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<void>;

  /**
   * Tar bort kopplingen mellan två användare (avböj en förfrågan eller ta bort
   * en kontakt). Endera part får göra det.
   */
  remove(userA: string, userB: string): Promise<void>;

  /** Alla `accepted`-kontakter som `userId` ingår i. */
  listAccepted(userId: string): Promise<Connection[]>;

  /** Inkommande `pending`-förfrågningar riktade till `userId`. */
  listIncomingPending(userId: string): Promise<Connection[]>;

  /**
   * ALLA kopplingar som `userId` ingår i, oavsett status och riktning. För
   * dataexport (GDPR, CLAUDE.md 9.2): användaren ska kunna se allt som rör dem.
   */
  listAllForUser(userId: string): Promise<Connection[]>;
}
