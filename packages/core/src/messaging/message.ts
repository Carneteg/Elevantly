/**
 * Meddelanden — det privata 1:1-lagret. Ett meddelande går mellan två användare
 * som är accepterade kontakter. Fritext som visas för parterna; driver inte
 * systemets resonemang (CLAUDE.md 7.3). Strikt privat: bara avsändare och
 * mottagare ser det (row-level security).
 */

/** Ett meddelande mellan två användare. */
export interface Message {
  /** Stabilt id (sätts av lagret/databasen). */
  id: string;
  /** Avsändarens userId. */
  senderId: string;
  /** Mottagarens userId. */
  recipientId: string;
  /** Meddelandets fritext. */
  body: string;
  /** När meddelandet skickades (ISO 8601). */
  createdAt: string;
}

/** Övre gräns på ett meddelandes längd — dataminimering och skydd mot missbruk. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Trimmad meddelandetext. */
export function normalizeMessageBody(body: string): string {
  return body.trim();
}

/** Är meddelandetexten giltig (icke-tom, inom längdgränsen) efter normalisering? */
export function isValidMessageBody(body: string): boolean {
  const normalized = normalizeMessageBody(body);
  return normalized.length > 0 && normalized.length <= MAX_MESSAGE_LENGTH;
}

/** Går meddelandet mellan exakt användarna `a` och `b` (endera riktning)? */
export function involvesBoth(message: Message, a: string, b: string): boolean {
  return (
    (message.senderId === a && message.recipientId === b) ||
    (message.senderId === b && message.recipientId === a)
  );
}

/**
 * Ordnar en konversationstråd kronologiskt, ÄLDST först (så tråden läses uppifrån
 * och ned). Ren och deterministisk; muterar inte indata.
 */
export function orderThread(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  });
}
