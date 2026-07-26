"use client";

import { useState } from "react";
import type { RelationshipState } from "@elevantly/core";

/** Vad knappen ska visa. `signed_out` = besökaren är inte inloggad. */
type ButtonState = RelationshipState | "signed_out";

/**
 * "Anslut"-knappen på en publik profil. Visar rätt tillstånd (ansluta, väntar,
 * svara, kontakt) och skickar en kontaktförfrågan via handle — mottagarens
 * userId löses upp på servern och når aldrig hit. Tydliga tillståndsändringar
 * och fel (Fas 2-acceptanskriterier).
 */
export function ConnectButton({
  handle,
  initialState,
}: {
  handle: string;
  initialState: ButtonState;
}) {
  const [state, setState] = useState<ButtonState>(initialState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function sendRequest() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", handle }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte skicka förfrågan.");
        return;
      }
      setState("outgoing_pending");
    } catch {
      setError("Kunde inte skicka förfrågan just nu.");
    } finally {
      setPending(false);
    }
  }

  if (state === "self") return null;

  if (state === "signed_out") {
    return (
      <a
        href="/login"
        className="inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
      >
        Logga in för att ansluta
      </a>
    );
  }

  if (state === "connected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]">
        ✓ Kontakt
      </span>
    );
  }

  if (state === "outgoing_pending") {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm text-[var(--color-muted)]">
        Förfrågan skickad
      </span>
    );
  }

  if (state === "incoming_pending") {
    return (
      <a
        href="/network"
        className="inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
      >
        Svara på förfrågan
      </a>
    );
  }

  // state === "none"
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={sendRequest}
        disabled={pending}
        className="inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Skickar …" : "Anslut"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
