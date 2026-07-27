import type { Connection } from "./connection";
import { canRequest, isParty } from "./connection";
import type { ConnectionRepository } from "./connectionRepository";

/**
 * In-memory-implementation av `ConnectionRepository`. Per-instans, överlever inte
 * en omstart — avsedd för tester och lokal utveckling tills Supabase-varianten
 * kopplas in bakom samma interface. Använd inte som varaktig lagring i drift.
 *
 * Kopplingar klonas in och ut så att lagringen inte kan muteras via en referens
 * som lämnat repositoryt.
 */
export class InMemoryConnectionRepository implements ConnectionRepository {
  private readonly connections: Connection[] = [];

  async findBetween(
    userA: string,
    userB: string,
  ): Promise<Connection | null> {
    const found = this.connections.find(
      (c) => isParty(c, userA) && isParty(c, userB),
    );
    return found ? clone(found) : null;
  }

  async request(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<Connection> {
    if (!canRequest(requesterId, addresseeId)) {
      throw new Error("Ogiltig förfrågan: kan inte koppla en användare till sig själv.");
    }
    const existing = await this.findBetween(requesterId, addresseeId);
    if (existing) {
      throw new Error("En koppling mellan användarna finns redan.");
    }
    const connection: Connection = {
      requesterId,
      addresseeId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.connections.push(clone(connection));
    return clone(connection);
  }

  async accept(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<void> {
    const connection = this.connections.find(
      (c) =>
        c.requesterId === requesterId &&
        c.addresseeId === addresseeId &&
        c.status === "pending",
    );
    if (!connection) return;
    connection.status = "accepted";
    connection.updatedAt = now;
  }

  async remove(userA: string, userB: string): Promise<void> {
    const index = this.connections.findIndex(
      (c) => isParty(c, userA) && isParty(c, userB),
    );
    if (index >= 0) this.connections.splice(index, 1);
  }

  async listAccepted(userId: string): Promise<Connection[]> {
    return this.connections
      .filter((c) => c.status === "accepted" && isParty(c, userId))
      .map(clone);
  }

  async listIncomingPending(userId: string): Promise<Connection[]> {
    return this.connections
      .filter((c) => c.status === "pending" && c.addresseeId === userId)
      .map(clone);
  }

  async listAllForUser(userId: string): Promise<Connection[]> {
    return this.connections.filter((c) => isParty(c, userId)).map(clone);
  }
}

function clone(connection: Connection): Connection {
  return structuredClone(connection);
}
