import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeMotivation,
  type Attestation,
  type AttestationInput,
  type AttestationStatus,
} from "./attestation";
import type { AttestationRepository } from "./attestationRepository";

/**
 * Supabase-backad `AttestationRepository`. Samma interface som in-memory-varianten.
 * Klienten injiceras och MÅSTE vara knuten till den inloggade sessionen så att
 * row-level security och security-definer-funktionerna avgör vad som får ske:
 * - `request_attestation` (definer): bara en accepterad kontakt, ej sig själv, ej
 *   blockerad, inom knapphetsbudgeten, en per beslut+attesterare.
 * - `decide_attestation` (definer): bara profilägaren avgör en väntande rad.
 * - `withdraw_attestation` (definer): bara attesteraren tar bort sin egen rad.
 * - `accepted_attestations_for` (definer): godkända rader, men bara om betraktaren
 *   får se profilen (samma synlighet som profilsidan).
 * Se `supabase/migrations/0017_attestations.sql`.
 */

const TABLE = "attestations";
const COLUMNS =
  "id, subject_user_id, decision_key, attester_user_id, motivation, status, created_at, decided_at";

interface AttestationRow {
  id: string;
  subject_user_id: string;
  decision_key: string;
  attester_user_id: string;
  motivation: string;
  status: AttestationStatus;
  created_at: string;
  decided_at: string | null;
}

export class SupabaseAttestationRepository implements AttestationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async request(
    input: AttestationInput,
    _attesterUserId: string,
    _now: string,
  ): Promise<Attestation> {
    // Attesteraren avgörs av sessionen (auth.uid()) i funktionen, aldrig en parameter.
    const { data, error } = await this.client.rpc("request_attestation", {
      p_subject: input.subjectUserId,
      p_decision_key: input.decisionKey,
      p_motivation: normalizeMotivation(input.motivation),
    });
    if (error) throw new Error(mapRequestError(error.message));

    const id = data as string;
    const { data: row, error: readError } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", id)
      .single<AttestationRow>();
    if (readError) {
      throw new Error("Attesteringen skapades men kunde inte läsas tillbaka.");
    }
    return rowToAttestation(row);
  }

  async listPendingForSubject(_subjectUserId: string): Promise<Attestation[]> {
    // RLS: ägaren ser bara sina egna rader — vi filtrerar bara på status.
    const { data, error } = await this.client
      .from(TABLE)
      .select(COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<AttestationRow[]>();

    if (error) throw new Error(`Kunde inte läsa attesteringar: ${error.message}`);
    return (data ?? []).map(rowToAttestation);
  }

  async decide(
    id: string,
    _subjectUserId: string,
    status: "accepted" | "declined",
    _now: string,
  ): Promise<void> {
    const { error } = await this.client.rpc("decide_attestation", {
      p_id: id,
      p_status: status,
    });
    if (error) throw new Error(`Kunde inte uppdatera attesteringen: ${error.message}`);
  }

  async withdraw(id: string, _attesterUserId: string): Promise<void> {
    const { error } = await this.client.rpc("withdraw_attestation", {
      p_id: id,
    });
    if (error) throw new Error(`Kunde inte dra tillbaka attesteringen: ${error.message}`);
  }

  async listAcceptedForSubject(subjectUserId: string): Promise<Attestation[]> {
    // Definer-funktionen släpper bara igenom rader om betraktaren får se profilen.
    const { data, error } = await this.client.rpc("accepted_attestations_for", {
      p_subject: subjectUserId,
    });
    if (error) throw new Error(`Kunde inte läsa attesteringar: ${error.message}`);
    return ((data as AttestationRow[]) ?? []).map(rowToAttestation);
  }

  async countActiveGivenBy(_attesterUserId: string): Promise<number> {
    // RLS: attesteraren ser bara sina egna rader — count på aktiva statusar.
    const { count, error } = await this.client
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "accepted"]);

    if (error) throw new Error(`Kunde inte räkna attesteringar: ${error.message}`);
    return count ?? 0;
  }
}

/** Gör databasfel begripliga för användaren utan att läcka interna detaljer. */
function mapRequestError(message: string): string {
  if (/duplicate key/i.test(message) || /unique/i.test(message)) {
    return "Du har redan attesterat det här beslutet.";
  }
  if (/budget|kvar/i.test(message)) {
    return "Du har inga attesteringar kvar att ge just nu.";
  }
  if (/kontakt/i.test(message)) {
    return "Bara en kontakt kan attestera ett beslut.";
  }
  if (/egna|sig själv/i.test(message)) {
    return "Du kan inte attestera dina egna beslut.";
  }
  return `Kunde inte attestera: ${message}`;
}

function rowToAttestation(row: AttestationRow): Attestation {
  return {
    id: row.id,
    subjectUserId: row.subject_user_id,
    decisionKey: row.decision_key,
    attesterUserId: row.attester_user_id,
    motivation: row.motivation,
    status: row.status,
    createdAt: row.created_at,
    ...(row.decided_at ? { decidedAt: row.decided_at } : {}),
  };
}
