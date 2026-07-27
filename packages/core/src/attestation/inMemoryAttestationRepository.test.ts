import { describe, expect, it } from "vitest";
import { InMemoryAttestationRepository } from "./inMemoryAttestationRepository";
import { MAX_ACTIVE_ATTESTATIONS } from "./attestation";

const NOW = "2026-01-01T00:00:00.000Z";
const GOOD = "Jag satt i samma team och såg utfallet";

function repo(
  isEligible: (a: string, s: string) => boolean = () => true,
): InMemoryAttestationRepository {
  return new InMemoryAttestationRepository(isEligible);
}

describe("InMemoryAttestationRepository", () => {
  it("skapar en väntande attestering som en behörig kontakt", async () => {
    const r = repo();
    const a = await r.request(
      { subjectUserId: "s", decisionKey: "k", motivation: GOOD },
      "att",
      NOW,
    );
    expect(a.status).toBe("pending");
    expect(a.attesterUserId).toBe("att");
    expect(await r.listPendingForSubject("s")).toHaveLength(1);
    // Väntande höjer inte bevisgraden — den syns inte som godkänd än.
    expect(await r.listAcceptedForSubject("s")).toHaveLength(0);
  });

  it("vägrar attestera sig själv", async () => {
    const r = repo();
    await expect(
      r.request({ subjectUserId: "s", decisionKey: "k", motivation: GOOD }, "s", NOW),
    ).rejects.toThrow(/egna/i);
  });

  it("vägrar en ogiltig motivering", async () => {
    const r = repo();
    await expect(
      r.request({ subjectUserId: "s", decisionKey: "k", motivation: "nej" }, "att", NOW),
    ).rejects.toThrow(/mening/i);
  });

  it("vägrar när attesteraren inte är en behörig kontakt", async () => {
    const r = repo(() => false);
    await expect(
      r.request({ subjectUserId: "s", decisionKey: "k", motivation: GOOD }, "att", NOW),
    ).rejects.toThrow(/kontakt/i);
  });

  it("tillåter bara en attestering per beslut och attesterare", async () => {
    const r = repo();
    await r.request({ subjectUserId: "s", decisionKey: "k", motivation: GOOD }, "att", NOW);
    await expect(
      r.request({ subjectUserId: "s", decisionKey: "k", motivation: GOOD }, "att", NOW),
    ).rejects.toThrow(/redan/i);
  });

  it("upprätthåller knapphetsbudgeten (aktiva räknas)", async () => {
    const r = repo();
    for (let i = 0; i < MAX_ACTIVE_ATTESTATIONS; i++) {
      await r.request(
        { subjectUserId: `s${i}`, decisionKey: "k", motivation: GOOD },
        "att",
        NOW,
      );
    }
    expect(await r.countActiveGivenBy("att")).toBe(MAX_ACTIVE_ATTESTATIONS);
    await expect(
      r.request({ subjectUserId: "sX", decisionKey: "k", motivation: GOOD }, "att", NOW),
    ).rejects.toThrow(/kvar/i);
  });

  it("godkänd attestering visas och frigör inte budget; avböjd frigör den", async () => {
    const r = repo();
    const a = await r.request(
      { subjectUserId: "s", decisionKey: "k", motivation: GOOD },
      "att",
      NOW,
    );
    await r.decide(a.id, "s", "accepted", NOW);
    expect(await r.listAcceptedForSubject("s")).toHaveLength(1);
    expect(await r.countActiveGivenBy("att")).toBe(1); // godkänd = fortfarande aktiv

    const b = await r.request(
      { subjectUserId: "s", decisionKey: "k2", motivation: GOOD },
      "att",
      NOW,
    );
    await r.decide(b.id, "s", "declined", NOW);
    expect(await r.countActiveGivenBy("att")).toBe(1); // avböjd frigör budget
  });

  it("bara ägaren kan avgöra sin egen attestering", async () => {
    const r = repo();
    const a = await r.request(
      { subjectUserId: "s", decisionKey: "k", motivation: GOOD },
      "att",
      NOW,
    );
    await expect(r.decide(a.id, "someone_else", "accepted", NOW)).rejects.toThrow(
      /hittades inte/i,
    );
  });

  it("attesteraren kan dra tillbaka och då frigörs budget + slot", async () => {
    const r = repo();
    const a = await r.request(
      { subjectUserId: "s", decisionKey: "k", motivation: GOOD },
      "att",
      NOW,
    );
    await r.withdraw(a.id, "att");
    expect(await r.countActiveGivenBy("att")).toBe(0);
    // Slot fri igen → kan begära på nytt.
    await expect(
      r.request({ subjectUserId: "s", decisionKey: "k", motivation: GOOD }, "att", NOW),
    ).resolves.toBeTruthy();
  });

  it("bara attesteraren kan dra tillbaka sin egen rad", async () => {
    const r = repo();
    const a = await r.request(
      { subjectUserId: "s", decisionKey: "k", motivation: GOOD },
      "att",
      NOW,
    );
    await expect(r.withdraw(a.id, "not_attester")).rejects.toThrow(/hittades inte/i);
  });
});
