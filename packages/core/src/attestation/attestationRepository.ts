import type { Attestation, AttestationInput } from "./attestation";

/**
 * Lagring av attesteringar — abstraherat bakom ett interface, som övriga lager
 * (§8.4). Två implementationer: `InMemoryAttestationRepository` (tester) och
 * `SupabaseAttestationRepository` (drift, där security-definer-funktioner och RLS
 * upprätthåller reglerna: bara en kontakt kan attestera, bara ägaren kan godkänna,
 * knapphetsbudgeten gäller, och parterna ser bara sina egna rader).
 *
 * Reglerna (kontakt krävs, ej sig själv, ej blockerad, budget, unik per
 * beslut+attesterare) hör hemma i lagret: in-memory-varianten upprätthåller dem i
 * kod, Supabase-varianten i databasen. Produktlogiken ser samma kontrakt.
 */
export interface AttestationRepository {
  /**
   * En kontakt begär att få attestera ett av `subjectUserId`s beslut. Skapar en
   * `pending`-attestering. Kastar om reglerna inte håller (ej kontakt, sig själv,
   * blockerad, budget slut, redan attesterat samma beslut).
   */
  request(
    input: AttestationInput,
    attesterUserId: string,
    now: string,
  ): Promise<Attestation>;

  /** Profilägarens inkorg: väntande attesteringar om HENS beslut. */
  listPendingForSubject(subjectUserId: string): Promise<Attestation[]>;

  /**
   * Profilägaren avgör en väntande attestering om sig själv: `accepted` (visas då)
   * eller `declined` (frigör attesterarens budget). Endast ägaren själv.
   */
  decide(
    id: string,
    subjectUserId: string,
    status: "accepted" | "declined",
    now: string,
  ): Promise<void>;

  /**
   * Attesteraren drar tillbaka sin egen attestering (väntande eller godkänd) —
   * tar bort raden och frigör budgeten. Endast attesteraren själv.
   */
  withdraw(id: string, attesterUserId: string): Promise<void>;

  /**
   * Godkända attesteringar av en användares beslut — för visning på profilen och
   * för att härleda bevisgraden. I drift returneras dessa bara om betraktaren får
   * se profilen (RLS/definer). Innehåller `attesterUserId` (server-komposition —
   * löses upp till handle/namn på servern, lämnar aldrig till klienten som userId).
   */
  listAcceptedForSubject(subjectUserId: string): Promise<Attestation[]>;

  /** Antal AKTIVA (väntande + godkända) attesteringar en användare gett — knapphet. */
  countActiveGivenBy(attesterUserId: string): Promise<number>;
}
