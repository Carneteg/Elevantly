"use client";

import { useState } from "react";
import { MAX_REPORT_REASON } from "@elevantly/core";
import type { ReportSubjectType } from "@elevantly/core";

/**
 * Rapportera en profil, ett inlägg eller ett meddelande. En tillgänglig
 * disclosure: knappen fäller ut ett litet formulär med en valfri motivering.
 * Diskret men nåbar — förtroende är produkten (CLAUDE.md 11).
 */
export function ReportButton({
  subjectType,
  subjectId,
  label = "Rapportera",
}: {
  subjectType: ReportSubjectType;
  subjectId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectType, subjectId, reason }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte skicka rapporten.");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Kunde inte skicka just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="text-sm text-[var(--color-muted)]">
        Tack — rapporten har tagits emot för granskning.
      </p>
    );
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[var(--color-muted)] underline transition hover:text-[var(--color-ink)]"
      >
        {label}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-2 flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-3"
        >
          <label htmlFor={`report-reason-${subjectId}`} className="font-medium">
            Varför rapporterar du det här?{" "}
            <span className="font-normal text-[var(--color-muted)]">(valfritt)</span>
          </label>
          <textarea
            id={`report-reason-${subjectId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={MAX_REPORT_REASON}
            placeholder="Beskriv kort vad som är fel."
            className="w-full resize-y rounded-lg border border-[var(--color-line)] p-2 outline-none focus:border-[var(--color-ink)]"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 font-medium text-white transition disabled:opacity-40"
            >
              {busy ? "Skickar …" : "Skicka rapport"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--color-muted)] underline"
            >
              Avbryt
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[var(--color-ink)]">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
