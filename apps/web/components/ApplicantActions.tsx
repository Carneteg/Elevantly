"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@elevantly/core";

/**
 * Arbetsgivarens beslut om en ansökan: granska, anta eller avböj. RLS ser till att
 * bara företagets medlemmar får ändra (CLAUDE.md 9). Vyn uppdateras efter beslut.
 */
export function ApplicantActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(next: ApplicationStatus) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setStatus",
          id: applicationId,
          status: next,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Kunde inte uppdatera.");
        return;
      }
      router.refresh();
    } catch {
      setError("Kunde inte uppdatera just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium transition hover:border-[var(--color-ink)] disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "reviewing" && status !== "accepted" && (
        <button type="button" onClick={() => setStatus("reviewing")} disabled={busy} className={btn}>
          Markera som granskas
        </button>
      )}
      {status !== "accepted" && (
        <button type="button" onClick={() => setStatus("accepted")} disabled={busy} className={btn}>
          Anta
        </button>
      )}
      {status !== "declined" && (
        <button type="button" onClick={() => setStatus("declined")} disabled={busy} className={btn}>
          Avböj
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
