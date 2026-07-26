import { redirect } from "next/navigation";
import {
  otherParty,
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PublicProfileSummary } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Meddelanden — dina samtal. I v1 kan du prata med dina accepterade kontakter,
 * så listan är dina kontakter (klicka för att öppna tråden). Skyddad; RLS gör
 * att bara du ser dina relationer.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const connections = new SupabaseConnectionRepository(supabase);
  const profiles = new SupabaseProfileRepository(supabase);

  const accepted = await connections.listAccepted(user.id);
  const contactIds = accepted.map((c) => otherParty(c, user.id));
  const summaries = await profiles.loadPublicSummariesByIds(contactIds);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Meddelanden
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Dina samtal
        </h1>
      </header>

      {summaries.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
          <p className="text-lg leading-snug">Du har inga samtal än.</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Meddelanden går till dina kontakter.{" "}
            <a href="/network" className="underline">
              Bygg ditt nätverk
            </a>{" "}
            så kan ni börja prata.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {summaries.map((contact: PublicProfileSummary) => (
            <li key={contact.userId}>
              <a
                href={`/messages/${contact.handle}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-line)] bg-white/50 p-4 transition hover:border-[var(--color-ink)]"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {contact.displayName ?? `@${contact.handle}`}
                  </span>
                  {contact.headline && (
                    <span className="block truncate text-sm text-[var(--color-muted)]">
                      {contact.headline}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="text-[var(--color-muted)]">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
