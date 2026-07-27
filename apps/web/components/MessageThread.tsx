"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@elevantly/core";
import type { Message } from "@elevantly/core";
import { createClient } from "@/lib/supabase/client";

/**
 * En live konversationstråd med en kontakt. Visar meddelanden (äldst först),
 * prenumererar på nya inkommande meddelanden via Supabase Realtime, och skickar
 * nya via /api/messages. RLS gäller även realtidsflödet — bara parterna får
 * uppdateringar. Egna meddelanden läggs till lokalt vid lyckad sändning.
 */
export function MessageThread({
  currentUserId,
  otherUserId,
  otherHandle,
  otherName,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherHandle: string;
  otherName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Prenumerera på inkommande meddelanden från den här kontakten.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${currentUserId}:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
          };
          if (row.sender_id !== otherUserId) return;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    senderId: row.sender_id,
                    recipientId: row.recipient_id,
                    body: row.body,
                    createdAt: row.created_at,
                  },
                ],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  // Rulla till senaste meddelandet när tråden växer.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const trimmed = body.trim();
  const canSend =
    trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !busy;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: otherHandle, body: trimmed }),
      });
      const data = (await res.json()) as { error?: string; message?: Message };
      if (!res.ok || !data.message) {
        setError(data.error ?? "Kunde inte skicka meddelandet.");
        return;
      }
      const sent = data.message;
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      setBody("");
    } catch {
      setError("Kunde inte skicka just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <ul
        aria-label={`Konversation med ${otherName}`}
        className="flex flex-col gap-3"
      >
        {messages.length === 0 ? (
          <li className="text-[var(--color-muted)]">
            Inga meddelanden än. Säg hej!
          </li>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <li
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    mine
                      ? "bg-[var(--color-ink)] text-white"
                      : "border border-[var(--color-line)] bg-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </li>
            );
          })
        )}
        <div ref={endRef} />
      </ul>

      <form onSubmit={send} className="mt-6 flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">
          Skriv ett meddelande till {otherName}
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Skriv ett meddelande …"
          className="min-h-11 flex-1 resize-y rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Skickar …" : "Skicka"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
