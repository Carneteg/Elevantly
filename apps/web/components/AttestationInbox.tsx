"use client";

import { useState } from "react";

/** En väntande attestering, färdigupplöst för visning (inga userId). */
export interface InboxItem {
  id: string;
  /** Beslutet som intygas (upplöst ur profilens beslut), eller null om okänt. */
  decisionAction: string | null;
  /** Attesterarens namn/handle om profilen är offentlig, annars null. */
  attesterName: string | null;
  attesterHandle: string | null;
  motivation: string;
}

/**
 * Profilägarens inkorg för attesteringar (roadmap Del 3 — samtycke, §9.3). En
 * attestering visas aldrig förrän ägaren godkänt den här. Varje post visar VILKET
 * beslut som intygas, VEM som intygar och deras MOTIVERING — ägaren avgör med full
 * kontext. Godkänn → beslutet blir ● attesterat på profilen; avböj → försvinner.
 */
export function AttestationInbox({ initialItems }: { initialItems: InboxItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(id: string, status: "accepted" | "declined") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/attestations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte uppdatera attesteringen.");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Kunde inte uppdatera attesteringen just nu.");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="attest-inbox-heading" className="mb-12">
      <h2 id="attest-inbox-heading" className="mb-2 text-xl font-semibold">
        Attesteringar att granska
      </h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Kontakter har intygat något du gjort. Ett intyg visas på din profil först när
        du godkänt det — du bestämmer.
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-[var(--color-line)] bg-white/50 p-5"
          >
            <p className="text-sm text-[var(--color-muted)]">
              {item.attesterName ? (
                <>
                  <span className="font-medium text-[var(--color-ink)]">
                    {item.attesterName}
                  </span>
                  {item.attesterHandle ? ` (@${item.attesterHandle})` : ""}
                </>
              ) : (
                "En kontakt"
              )}{" "}
              vill intyga:
            </p>
            {item.decisionAction && (
              <p className="mt-1 leading-snug">“{item.decisionAction}”</p>
            )}
            <p className="mt-2 rounded-lg bg-[var(--color-accent)]/5 p-3 text-sm">
              {item.motivation}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => decide(item.id, "accepted")}
                disabled={busyId === item.id}
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Godkänn
              </button>
              <button
                type="button"
                onClick={() => decide(item.id, "declined")}
                disabled={busyId === item.id}
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)] disabled:opacity-40"
              >
                Avböj
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
