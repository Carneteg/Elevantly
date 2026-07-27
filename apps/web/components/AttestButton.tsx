"use client";

import { useState } from "react";
import { MOTIVATION_MIN, normalizeMotivation } from "@elevantly/core";

/**
 * Attesteringsknappen — visas per beslut på en KONTAKTS profil (Zon C). Att
 * attestera är medvetet dyrt (roadmap Del 3): inte en tumme-upp utan en liten
 * dialog som kräver en kort motivering ("Hur vet du det här?"). Skickar en begäran
 * som profilägaren måste godkänna innan den visas. Knappheten (återstående budget)
 * är synlig — det är designat för att göra varje attestering socialt trovärdig.
 *
 * Beslutet identifieras via `decisionKey` (stabil innehållsnyckel); ägarens userId
 * löses upp på servern via handle och når aldrig hit.
 */
export function AttestButton({
  handle,
  decisionKey,
  decisionAction,
  remaining,
}: {
  handle: string;
  decisionKey: string;
  decisionAction: string;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const trimmedLength = normalizeMotivation(motivation).length;
  const canSubmit = trimmedLength >= MOTIVATION_MIN && !pending;

  async function submit() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, decisionKey, motivation }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte skicka attesteringen.");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Kunde inte skicka attesteringen just nu.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="mt-3 text-sm text-[var(--color-accent)]">
        ✓ Attestering skickad — väntar på {`@${handle}`}s godkännande.
      </p>
    );
  }

  if (remaining <= 0 && !open) {
    return (
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Du har inga attesteringar kvar att ge just nu.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-xs text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        ○→● Attestera
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-4">
      <p className="text-sm font-medium">Intyga det här beslutet</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        “{decisionAction}”
      </p>
      <label className="mt-3 block text-sm text-[var(--color-muted)]">
        Hur vet du det här? En kort mening ger attesteringen tyngd.
      </label>
      <textarea
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="T.ex. Jag satt i samma team och såg churn-siffrorna före och efter."
        className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white/70 p-3 text-sm"
      />
      <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>
          {trimmedLength < MOTIVATION_MIN
            ? `Minst ${MOTIVATION_MIN} tecken`
            : "Redo att skicka"}
        </span>
        <span>{remaining} attesteringar kvar</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "Skickar…" : "Skicka attestering"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)]"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
