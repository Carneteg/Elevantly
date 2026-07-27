"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "accept" | "decline" | "remove";

/**
 * Åtgärdsknappar för en rad i nätverket: acceptera/avböj en förfrågan, eller ta
 * bort en kontakt. Refererar motparten via userId (från den autentiserade
 * nätverkssidan) — RLS avgör vad som faktiskt får ske. Efter en lyckad åtgärd
 * hämtas serverns sanning på nytt (`router.refresh`).
 */
export function ConnectionActions({
  userId,
  kind,
}: {
  userId: string;
  kind: "request" | "contact";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: Action) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte genomföra åtgärden.");
        return;
      }
      router.refresh();
    } catch {
      setError("Kunde inte genomföra åtgärden just nu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {kind === "request" ? (
          <>
            <button
              type="button"
              onClick={() => act("accept")}
              disabled={busy}
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
            >
              Acceptera
            </button>
            <button
              type="button"
              onClick={() => act("decline")}
              disabled={busy}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-40"
            >
              Avböj
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => act("remove")}
            disabled={busy}
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            Ta bort
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
