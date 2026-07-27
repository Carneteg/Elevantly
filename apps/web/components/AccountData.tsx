"use client";

import { useState } from "react";

type DeleteStatus = "idle" | "deleting" | "error";

/**
 * Din data (GDPR, CLAUDE.md 9.2). Två uttryckliga handlingar användaren äger:
 * - Exportera: laddar ner ALLT vi lagrar om dig som en JSON-fil.
 * - Radera konto: irreversibelt. Kräver att du skriver RADERA för att undvika
 *   misstag — ett medvetet val, inget mörkt mönster (CLAUDE.md 8.2 / 11).
 */
export function AccountData() {
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const [error, setError] = useState("");

  const canDelete = confirmText.trim().toUpperCase() === "RADERA";

  async function handleDelete() {
    if (!canDelete) return;
    setStatus("deleting");
    setError("");
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus("error");
        setError(data.error ?? "Kontot kunde inte raderas. Försök igen.");
        return;
      }
      // Kontot är borta — lämna appen.
      window.location.assign("/");
    } catch {
      setStatus("error");
      setError("Kontot kunde inte raderas just nu. Försök igen.");
    }
  }

  return (
    <section
      aria-labelledby="data-heading"
      className="mt-16 border-t border-[var(--color-line)] pt-10"
    >
      <h2 id="data-heading" className="mb-2 text-xl font-semibold">
        Din data
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        Du äger din data. Ladda ner allt vi lagrar om dig, eller radera ditt
        konto helt.
      </p>

      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
        <div>
          <a
            href="/api/account/export"
            className="inline-block rounded-full border border-[var(--color-ink)] px-6 py-3 font-medium transition hover:bg-[var(--color-ink)] hover:text-white"
            download
          >
            Exportera min data (JSON)
          </a>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Profil, beslut, kopplingar, inlägg, meddelanden och blockeringar.
          </p>
        </div>

        <div className="mt-2 border-t border-[var(--color-line)] pt-6">
          <h3 className="font-medium">Radera konto</h3>
          <p className="mt-1 mb-3 text-sm text-[var(--color-muted)]">
            Detta raderar all din data permanent och går inte att ångra. Skriv{" "}
            <span className="font-semibold">RADERA</span> för att bekräfta.
          </p>
          <label htmlFor="confirm-delete" className="sr-only">
            Skriv RADERA för att bekräfta
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RADERA"
            aria-describedby="delete-error"
            className="w-full max-w-xs rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]"
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || status === "deleting"}
              className="rounded-full bg-[var(--color-ink)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "deleting" ? "Raderar …" : "Radera mitt konto"}
            </button>
          </div>
          {error && (
            <p id="delete-error" role="alert" className="mt-3 text-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
