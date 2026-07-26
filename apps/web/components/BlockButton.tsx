"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Blockera / avblockera en användare. Diskret men nåbar. Att blockera bryter även
 * en eventuell koppling; efteråt hämtas serverns sanning på nytt så att övriga
 * ytor (t.ex. "Anslut") speglar det nya läget.
 */
export function BlockButton({
  handle,
  initiallyBlocked,
}: {
  handle: string;
  initiallyBlocked: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const action = blocked ? "unblock" : "block";
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, handle }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte genomföra åtgärden.");
        return;
      }
      setBlocked(!blocked);
      router.refresh();
    } catch {
      setError("Kunde inte genomföra just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="text-[var(--color-muted)] underline transition hover:text-[var(--color-ink)] disabled:opacity-40"
      >
        {blocked ? "Avblockera" : "Blockera"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
