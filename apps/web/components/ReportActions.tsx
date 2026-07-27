"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportStatus } from "@elevantly/core";

/**
 * Granskaråtgärder för en rapport: markera hanterad eller avvisa. Ett medvetet
 * mänskligt beslut (CLAUDE.md 11) — inga automatiska konsekvenser. Efter en
 * åtgärd uppdateras kön (rapporten faller ur listan).
 */
export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<ReportStatus | null>(null);
  const [error, setError] = useState("");

  async function act(status: ReportStatus) {
    setBusy(status);
    setError("");
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Åtgärden kunde inte genomföras.");
        return;
      }
      router.refresh();
    } catch {
      setError("Åtgärden kunde inte genomföras just nu. Försök igen.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => act("resolved")}
        disabled={busy !== null}
        className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-40"
      >
        {busy === "resolved" ? "Sparar …" : "Markera hanterad"}
      </button>
      <button
        type="button"
        onClick={() => act("dismissed")}
        disabled={busy !== null}
        className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium transition hover:border-[var(--color-ink)] disabled:opacity-40"
      >
        {busy === "dismissed" ? "Sparar …" : "Avvisa"}
      </button>
      {error && (
        <span role="alert" className="text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
