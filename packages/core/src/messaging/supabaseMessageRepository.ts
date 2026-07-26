import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./message";
import { isValidMessageBody, normalizeMessageBody } from "./message";
import type { MessageRepository } from "./messageRepository";

/**
 * Supabase-backad `MessageRepository`. Samma interface som in-memory-varianten.
 * Klienten injiceras och MÅSTE vara knuten till den inloggade användarens session,
 * så att row-level security gäller: bara avsändare och mottagare ser ett meddelande,
 * och man kan bara skriva till en accepterad kontakt. Se `supabase/migrations/`.
 */

const TABLE = "messages";
const COLUMNS = "id, sender_id, recipient_id, body, created_at";

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

export class SupabaseMessageRepository implements MessageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async send(
    senderId: string,
    recipientId: string,
    body: string,
    now: string,
  ): Promise<Message> {
    if (!senderId || !recipientId) {
      throw new Error("Både avsändare och mottagare krävs.");
    }
    if (senderId === recipientId) {
      throw new Error("Kan inte skicka meddelande till sig själv.");
    }
    if (!isValidMessageBody(body)) {
      throw new Error("Ogiltig meddelandetext (tom eller för lång).");
    }
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        body: normalizeMessageBody(body),
        created_at: now,
      })
      .select(COLUMNS)
      .single<MessageRow>();

    if (error) throw new Error(`Kunde inte skicka meddelande: ${error.message}`);
    return rowToMessage(data);
  }

  async listThread(
    userA: string,
    userB: string,
    limit = 500,
  ): Promise<Message[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .or(
        `and(sender_id.eq.${userA},recipient_id.eq.${userB}),` +
          `and(sender_id.eq.${userB},recipient_id.eq.${userA})`,
      )
      .order("created_at", { ascending: true })
      .limit(limit)
      .returns<MessageRow[]>();

    if (error) throw new Error(`Kunde inte läsa konversationen: ${error.message}`);
    return (data ?? []).map(rowToMessage);
  }
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
  };
}
