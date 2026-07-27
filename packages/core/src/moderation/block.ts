/**
 * Trust & safety — blockering (missbruksskydd). En användare kan blockera en
 * annan; då kan de inte längre kontakta varandra (meddelanden eller
 * kontaktförfrågningar). Integritetsbevarande: man ska inte kunna avläsa att man
 * blockerats (upprätthålls via en `security definer`-funktion i databasen).
 *
 * Rent id-baserat, riktat par: `blockerId` blockerade `blockedId`.
 */
export interface Block {
  /** Användaren som blockerade. */
  blockerId: string;
  /** Användaren som blockerades. */
  blockedId: string;
  /** När blockeringen skapades (ISO 8601). */
  createdAt: string;
}
