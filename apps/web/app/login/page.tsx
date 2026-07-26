"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Inloggning via magisk länk. Användaren skriver sin e-post och får en
 * inloggningslänk — inga lösenord. Låg friktion (CLAUDE.md 5).
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const canSubmit = email.trim().length > 3 && status !== "sending";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setStatus("error");
        setMessage("Kunde inte skicka länken. Kontrollera adressen och försök igen.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage("Inloggning är inte tillgänglig just nu.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Elevantly
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold">Logga in</h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Vi mejlar dig en inloggningslänk. Inga lösenord.
        </p>
      </header>

      {status === "sent" ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <p className="text-lg leading-snug">Kolla din mejl 📬</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Vi skickade en inloggningslänk till{" "}
            <span className="text-[var(--color-ink)]">{email.trim()}</span>. Öppna
            den på den här enheten för att logga in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@epost.se"
            aria-label="E-postadress"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white p-4 text-lg outline-none transition focus:border-[var(--color-ink)]"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "sending" ? "Skickar …" : "Skicka inloggningslänk"}
          </button>
          {status === "error" && (
            <p role="alert" className="text-[var(--color-ink)]">
              {message}
            </p>
          )}
        </form>
      )}

      <p className="mt-8 text-sm text-[var(--color-muted)]">
        <a href="/" className="underline">
          ← Tillbaka till Spegeln
        </a>
      </p>
    </main>
  );
}
