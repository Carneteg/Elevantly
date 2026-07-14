"use client";

import { useState } from "react";
import type { Reflection } from "@elevantly/core";
import { ReflectionView } from "./ReflectionView";

type Status = "idle" | "loading" | "done" | "error";

const PLACEHOLDER =
  "T.ex. Jag byggde om vårt onboarding-flöde och minskade churn med 12 %. " +
  "Jag ledde ett team på fyra genom en stökig migrering och vi höll deadline …";

export function Spegeln() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = text.trim().length > 0 && status !== "loading";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(readError(data));
        setStatus("error");
        return;
      }

      setReflection((data as { reflection: Reflection }).reflection);
      setStatus("done");
    } catch {
      setErrorMessage("Något gick fel. Kontrollera anslutningen och försök igen.");
      setStatus("error");
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl+Enter för att spegla — musen behövs aldrig.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const isLoading = status === "loading";

  return (
    <div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER}
        rows={7}
        aria-label="Beskriv vad du gjort i jobbet"
        className="w-full resize-y rounded-2xl border border-[var(--color-line)] bg-white p-5 text-lg leading-relaxed outline-none transition focus:border-[var(--color-ink)]"
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-muted)]">
          Din text skickas till AI-motorn för att struktureras och sparas inte.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="shrink-0 rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading
            ? "Speglar …"
            : status === "done"
              ? "Spegla igen"
              : "Spegla"}
        </button>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-6 text-[var(--color-ink)]">
          {errorMessage}
        </p>
      )}

      {status === "done" && reflection && (
        <ReflectionView reflection={reflection} />
      )}
    </div>
  );
}

function readError(data: unknown): string {
  const message = (data as { error?: unknown })?.error;
  return typeof message === "string" && message.length > 0
    ? message
    : "Något gick fel. Försök igen.";
}
