import type { Message } from "./message";
import {
  involvesBoth,
  isValidMessageBody,
  normalizeMessageBody,
  orderThread,
} from "./message";
import type { MessageRepository } from "./messageRepository";

/**
 * In-memory-implementation av `MessageRepository`. Per-instans, överlever inte en
 * omstart — avsedd för tester och lokal utveckling tills Supabase-varianten
 * kopplas in bakom samma interface. Meddelanden klonas in och ut så att lagringen
 * inte kan muteras via en referens som lämnat repositoryt.
 */
export class InMemoryMessageRepository implements MessageRepository {
  private readonly messages: Message[] = [];
  private seq = 0;

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
    const message: Message = {
      id: `msg-${++this.seq}`,
      senderId,
      recipientId,
      body: normalizeMessageBody(body),
      createdAt: now,
    };
    this.messages.push({ ...message });
    return { ...message };
  }

  async listThread(
    userA: string,
    userB: string,
    limit = 500,
  ): Promise<Message[]> {
    return orderThread(
      this.messages.filter((m) => involvesBoth(m, userA, userB)),
    )
      .slice(-limit)
      .map((m) => ({ ...m }));
  }
}
