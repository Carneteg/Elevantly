/**
 * Kontakter (connections) — det första relationslagret. En koppling är en
 * ömsesidig, samtyckesbaserad relation mellan två användare: en skickar en
 * förfrågan, den andra accepterar (CLAUDE.md 6.5 — riktiga relationer, inga
 * påtvingade följare).
 *
 * Detta är STRUKTURERAD data (userId ↔ userId) och driver logiken. Ingen fritext,
 * inga fåfänga-siffror. Modellen är rent id-baserad — hur en användare visas
 * (namn/handle) är en separat presentationsfråga och läcker aldrig in hit.
 */

/** En kopplings status. `pending` tills mottagaren accepterat, sedan `accepted`. */
export type ConnectionStatus = "pending" | "accepted";

/**
 * En koppling mellan två användare. `requesterId` skickade förfrågan,
 * `addresseeId` är mottagaren. Exakt en post per par (oavsett riktning).
 */
export interface Connection {
  /** Användaren som skickade förfrågan. */
  requesterId: string;
  /** Användaren som tog emot förfrågan (och kan acceptera). */
  addresseeId: string;
  /** Status. Default `pending`. */
  status: ConnectionStatus;
  /** När förfrågan skapades (ISO 8601). */
  createdAt: string;
  /** När kopplingen senast ändrades (ISO 8601). */
  updatedAt: string;
}

/**
 * Relationens tillstånd sett från en viss användares perspektiv — det som en yta
 * behöver för att veta vilken knapp som ska visas. Ren härledning ur en koppling.
 *
 * - `self`             Samma person — ingen relation möjlig.
 * - `none`             Ingen koppling finns.
 * - `outgoing_pending` Du har skickat en förfrågan som väntar på svar.
 * - `incoming_pending` Du har fått en förfrågan att svara på.
 * - `connected`        Ni är kontakter.
 */
export type RelationshipState =
  | "self"
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "connected";

/** Får `viewer` skicka en förfrågan till `other`? Bara om det inte är samma person. */
export function canRequest(viewerId: string, otherId: string): boolean {
  return Boolean(viewerId) && Boolean(otherId) && viewerId !== otherId;
}

/**
 * Härleder relationens tillstånd sett från `viewerId` gentemot `otherId`, givet
 * kopplingen mellan dem (eller `null` om ingen finns). Ren och deterministisk.
 */
export function relationshipState(
  connection: Connection | null,
  viewerId: string,
  otherId: string,
): RelationshipState {
  if (viewerId === otherId) return "self";
  if (!connection) return "none";
  if (connection.status === "accepted") return "connected";
  // pending: vem skickade avgör riktningen.
  return connection.requesterId === viewerId
    ? "outgoing_pending"
    : "incoming_pending";
}

/** Är `userId` en av parterna i kopplingen? */
export function isParty(connection: Connection, userId: string): boolean {
  return (
    connection.requesterId === userId || connection.addresseeId === userId
  );
}

/**
 * Ger den andra partens userId i en koppling sett från `userId`. Antar att
 * `userId` är en av parterna (annars returneras `addresseeId`).
 */
export function otherParty(connection: Connection, userId: string): string {
  return connection.requesterId === userId
    ? connection.addresseeId
    : connection.requesterId;
}
