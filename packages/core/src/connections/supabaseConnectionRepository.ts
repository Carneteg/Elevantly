import type { SupabaseClient } from "@supabase/supabase-js";
import type { Connection, ConnectionStatus } from "./connection";
import { canRequest } from "./connection";
import type { ConnectionRepository } from "./connectionRepository";

/**
 * Supabase-backad `ConnectionRepository`. Samma interface som in-memory-varianten
 * — produktlogiken ser ingen skillnad. Klienten injiceras och MÅSTE vara knuten
 * till den inloggade användarens session, så att row-level security gäller (bara
 * parterna når en rad; bara mottagaren kan acceptera). Se `supabase/migrations/`.
 */

const TABLE = "connections";
const COLUMNS = "requester_id, addressee_id, status, created_at, updated_at";

interface ConnectionRow {
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

export class SupabaseConnectionRepository implements ConnectionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findBetween(
    userA: string,
    userB: string,
  ): Promise<Connection | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .or(pairFilter(userA, userB))
      .maybeSingle<ConnectionRow>();

    if (error) throw new Error(`Kunde inte läsa koppling: ${error.message}`);
    return data ? rowToConnection(data) : null;
  }

  async request(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<Connection> {
    if (!canRequest(requesterId, addresseeId)) {
      throw new Error("Ogiltig förfrågan: kan inte koppla en användare till sig själv.");
    }
    const row: ConnectionRow = {
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "pending",
      created_at: now,
      updated_at: now,
    };
    const { error } = await this.client.from(TABLE).insert(row);
    if (error) throw new Error(`Kunde inte skapa förfrågan: ${error.message}`);
    return rowToConnection(row);
  }

  async accept(
    requesterId: string,
    addresseeId: string,
    now: string,
  ): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ status: "accepted", updated_at: now })
      .eq("requester_id", requesterId)
      .eq("addressee_id", addresseeId)
      .eq("status", "pending");

    if (error) throw new Error(`Kunde inte acceptera förfrågan: ${error.message}`);
  }

  async remove(userA: string, userB: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .or(pairFilter(userA, userB));

    if (error) throw new Error(`Kunde inte ta bort koppling: ${error.message}`);
  }

  async listAccepted(userId: string): Promise<Connection[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw new Error(`Kunde inte läsa kontakter: ${error.message}`);
    return (data ?? []).map(rowToConnection);
  }

  async listIncomingPending(userId: string): Promise<Connection[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("status", "pending")
      .eq("addressee_id", userId);

    if (error) throw new Error(`Kunde inte läsa förfrågningar: ${error.message}`);
    return (data ?? []).map(rowToConnection);
  }
}

/** PostgREST `.or`-filter för ett oordnat par (endera riktning). */
function pairFilter(userA: string, userB: string): string {
  return (
    `and(requester_id.eq.${userA},addressee_id.eq.${userB}),` +
    `and(requester_id.eq.${userB},addressee_id.eq.${userA})`
  );
}

function rowToConnection(row: ConnectionRow): Connection {
  return {
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
