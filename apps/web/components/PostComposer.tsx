"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_POST_LENGTH } from "@elevantly/core";

/** Ett av författarens beslut som ett inlägg kan grundas i (för väljaren). */
export interface DecisionOption {
  index: number;
  label: string;
}

/**
 * Lågfriktions-kompositor för ett flödesinlägg. Fritext in; publiceras till
 * nätverket. Valfritt kan inlägget grundas i ett av dina egna bevisade beslut —
 * substans över fåfänga (CLAUDE.md 6.5/11). Tydligt systemtillstånd
 * (teckenräknare, fel, sparbekräftelse) och kopplade labels (a11y).
 */
export function PostComposer({
  decisions = [],
}: {
  decisions?: DecisionOption[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [decisionIndex, setDecisionIndex] = useState<string>("");
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
        body: JSON.stringify({
          body: trimmed,
          ...(decisionIndex !== ""
            ? { decisionIndex: Number(decisionIndex) }
            : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte publicera.");
        return;
      }
      setBody("");
      setDecisionIndex("");
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

      {decisions.length > 0 && (
        <div className="mt-3">
          <label
            htmlFor="post-grounding"
            className="text-sm font-medium"
          >
            Grunda i ett beslut{" "}
            <span className="font-normal text-[var(--color-muted)]">(valfritt)</span>
          </label>
          <select
            id="post-grounding"
            value={decisionIndex}
            onChange={(e) => setDecisionIndex(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]"
          >
            <option value="">Inget beslut — bara ett inlägg</option>
            {decisions.map((d) => (
              <option key={d.index} value={String(d.index)}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Knyt inlägget till något du faktiskt gjort — det visas som en spårbar grund.
          </p>
        </div>
      )}

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
