"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@elevantly/core";

/**
 * Statusåtgärder för en arbetsgivares jobb: publicera ett utkast, stäng ett
 * publicerat, eller öppna ett stängt igen. RLS ser till att bara företagets
 * medlemmar får ändra (CLAUDE.md 9). Kön/vyn uppdateras efter åtgärd.
 */
export function JobStatusActions({
  jobId,
  companyId,
  status,
}: {
  jobId: string;
  companyId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(next: JobStatus) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setStatus",
          id: jobId,
          companyId,
          status: next,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Kunde inte ändra status.");
        return;
      }
      router.refresh();
    } catch {
      setError("Kunde inte ändra just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium transition hover:border-[var(--color-ink)] disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <button
          type="button"
          onClick={() => setStatus("published")}
          disabled={busy}
          className={btn}
        >
          Publicera
        </button>
      )}
      {status === "published" && (
        <button
          type="button"
          onClick={() => setStatus("closed")}
          disabled={busy}
          className={btn}
        >
          Stäng
        </button>
      )}
      {status === "closed" && (
        <button
          type="button"
          onClick={() => setStatus("published")}
          disabled={busy}
          className={btn}
        >
          Öppna igen
        </button>
      )}
      {error && (
        <span role="alert" className="text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
