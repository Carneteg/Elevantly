"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_COMPANY_NAME, MAX_COMPANY_SUMMARY } from "@elevantly/core";

/**
 * Skapa ett företag (självbetjänat). Lågfriktion: namn krävs, kort beskrivning är
 * valfri. Tydligt systemtillstånd (fel, sparande). Efter skapande uppdateras sidan
 * så företaget dyker upp i listan.
 */
export function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length > 0 && !busy;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), summary: summary.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte skapa företaget.");
        return;
      }
      setName("");
      setSummary("");
      router.refresh();
    } catch {
      setError("Kunde inte skapa just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]";

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-white/50 p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="company-name" className="text-sm font-medium">
          Företagsnamn
        </label>
        <input
          id="company-name"
          type="text"
          value={name}
          maxLength={MAX_COMPANY_NAME}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Nordic Fintech AB"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="company-summary" className="text-sm font-medium">
          Kort beskrivning{" "}
          <span className="font-normal text-[var(--color-muted)]">(valfritt)</span>
        </label>
        <textarea
          id="company-summary"
          value={summary}
          rows={2}
          maxLength={MAX_COMPANY_SUMMARY}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Vad gör ni?"
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Skapar …" : "Skapa företag"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </form>
  );
}
