import {
  canGiveMore,
  isValidMotivation,
  normalizeMotivation,
  type Attestation,
  type AttestationInput,
} from "./attestation";
import type { AttestationRepository } from "./attestationRepository";

/**
 * In-memory-implementation av `AttestationRepository` — för tester och lokal
 * körning. Upprätthåller SAMMA regler som Supabase-varianten gör i databasen, i
 * ren kod: ej sig själv, giltig motivering, bara en kontakt får attestera (via en
 * injicerad behörighetskoll), knapphetsbudget, och en attestering per
 * beslut+attesterare. Ingen databas, ingen tid från klockan (nu skickas in).
 */
export class InMemoryAttestationRepository implements AttestationRepository {
  private readonly rows: Attestation[] = [];
  private seq = 0;

  /**
   * @param isEligibleAttester Avgör om en attesterare får attestera en viss
   *   användare (accepterad kontakt och ej blockerad). Default tillåter alla —
   *   tester som inte bryr sig om relationen slipper sätta den. I drift görs denna
   *   koll i databasen (RLS/definer), aldrig här.
   */
  constructor(
    private readonly isEligibleAttester: (
      attesterUserId: string,
      subjectUserId: string,
    ) => boolean = () => true,
  ) {}

  async request(
    input: AttestationInput,
    attesterUserId: string,
    now: string,
  ): Promise<Attestation> {
    const { subjectUserId, decisionKey } = input;
    if (!attesterUserId) throw new Error("Ingen inloggad användare.");
    if (subjectUserId === attesterUserId) {
      throw new Error("Du kan inte attestera dina egna beslut.");
    }
    if (!isValidMotivation(input.motivation)) {
      throw new Error("Motiveringen måste vara en kort mening.");
    }
    if (!this.isEligibleAttester(attesterUserId, subjectUserId)) {
      throw new Error("Bara en kontakt kan attestera ett beslut.");
    }
    if (this.rows.some((r) => sameTriple(r, subjectUserId, decisionKey, attesterUserId))) {
      throw new Error("Du har redan attesterat det här beslutet.");
    }
    if (!canGiveMore(this.countActive(attesterUserId))) {
      throw new Error("Du har inga attesteringar kvar att ge just nu.");
    }

    const row: Attestation = {
      id: `att_${++this.seq}`,
      subjectUserId,
      decisionKey,
      attesterUserId,
      motivation: normalizeMotivation(input.motivation),
      status: "pending",
      createdAt: now,
    };
    this.rows.push(row);
    return { ...row };
  }

  async listPendingForSubject(subjectUserId: string): Promise<Attestation[]> {
    return this.rows
      .filter((r) => r.subjectUserId === subjectUserId && r.status === "pending")
      .map((r) => ({ ...r }));
  }

  async decide(
    id: string,
    subjectUserId: string,
    status: "accepted" | "declined",
    now: string,
  ): Promise<void> {
    const row = this.rows.find((r) => r.id === id);
    if (!row || row.subjectUserId !== subjectUserId) {
      throw new Error("Attesteringen hittades inte.");
    }
    if (row.status !== "pending") {
      throw new Error("Attesteringen är redan avgjord.");
    }
    row.status = status;
    row.decidedAt = now;
  }

  async withdraw(id: string, attesterUserId: string): Promise<void> {
    const idx = this.rows.findIndex(
      (r) => r.id === id && r.attesterUserId === attesterUserId,
    );
    if (idx === -1) throw new Error("Attesteringen hittades inte.");
    this.rows.splice(idx, 1);
  }

  async listAcceptedForSubject(subjectUserId: string): Promise<Attestation[]> {
    return this.rows
      .filter((r) => r.subjectUserId === subjectUserId && r.status === "accepted")
      .map((r) => ({ ...r }));
  }

  async countActiveGivenBy(attesterUserId: string): Promise<number> {
    return this.countActive(attesterUserId);
  }

  /** Aktiv = väntande eller godkänd. Avböjda/tillbakadragna räknas inte. */
  private countActive(attesterUserId: string): number {
    return this.rows.filter(
      (r) =>
        r.attesterUserId === attesterUserId &&
        (r.status === "pending" || r.status === "accepted"),
    ).length;
  }
}

function sameTriple(
  row: Attestation,
  subjectUserId: string,
  decisionKey: string,
  attesterUserId: string,
): boolean {
  return (
    row.subjectUserId === subjectUserId &&
    row.decisionKey === decisionKey &&
    row.attesterUserId === attesterUserId
  );
}
