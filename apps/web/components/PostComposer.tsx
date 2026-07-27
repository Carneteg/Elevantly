"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_POST_LENGTH } from "@elevantly/core";

/**
 * Lågfriktions-kompositor för ett flödesinlägg. Fritext in; publiceras till
 * nätverket. Tydligt systemtillstånd (teckenräknare, fel, sparbekräftelse) och
 * kopplad label (a11y).
 */
export function PostComposer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const trimmed = body.trim();
  const canPost = trimmed.length > 0 && trimmed.length <= MAX_POST_LENGTH && !busy;

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!canPost) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte publicera.");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("Kunde inte publicera just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={publish}
      className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-5"
    >
      <label htmlFor="post-body" className="text-sm font-medium">
        Dela något med ditt nätverk
      </label>
      <textarea
        id="post-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={MAX_POST_LENGTH}
        placeholder="Vad har du lärt dig, beslutat eller åstadkommit?"
        className="mt-2 w-full resize-y rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <span
          className="text-sm text-[var(--color-muted)]"
          aria-live="polite"
        >
          {trimmed.length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="submit"
          disabled={!canPost}
          className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Publicerar …" : "Publicera"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </form>
  );
}
