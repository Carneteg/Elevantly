"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_APPLICATION_MESSAGE } from "@elevantly/core";

/**
 * Sök ett jobb. Din grundade profil ÄR ansökan — vid ansökan sparas en samtyckt
 * ögonblicksbild av dina beslut (CLAUDE.md 9.3). Valfritt personligt meddelande.
 * En tillgänglig disclosure; visar "Sökt" när du redan ansökt.
 */
export function ApplyButton({
  jobId,
  applied,
}: {
  jobId: string;
  applied: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(applied);
  const [error, setError] = useState("");

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-[var(--color-accent)]">
        ✓ Du har sökt det här jobbet
      </p>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, message: message.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte skicka ansökan.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Kunde inte skicka just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Sök jobbet
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-1 flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-3"
    >
      <label htmlFor={`apply-${jobId}`} className="text-sm font-medium">
        Meddelande{" "}
        <span className="font-normal text-[var(--color-muted)]">(valfritt)</span>
      </label>
      <textarea
        id={`apply-${jobId}`}
        value={message}
        rows={2}
        maxLength={MAX_APPLICATION_MESSAGE}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Något du vill lyfta fram?"
        className="w-full resize-y rounded-lg border border-[var(--color-line)] p-2 text-sm outline-none focus:border-[var(--color-ink)]"
      />
      <p className="text-xs text-[var(--color-muted)]">
        Du delar en ögonblicksbild av din grundade profil (namn, headline och beslut)
        med arbetsgivaren för den här ansökan.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition disabled:opacity-40"
        >
          {busy ? "Skickar …" : "Skicka ansökan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-muted)] underline"
        >
          Avbryt
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
