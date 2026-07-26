import { redirect } from "next/navigation";
import {
  otherParty,
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PublicProfileSummary } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { ConnectionActions } from "@/components/ConnectionActions";

/**
 * Nätverk — dina kontakter och inkommande förfrågningar. Skyddad (kräver
 * inloggning). Row-level security gör att du bara ser kopplingar du är part i.
 * Motparterna visas via deras offentliga profil (namn/headline + länk till
 * /u/handle); userId används bara för åtgärder och visas aldrig.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NetworkEntry {
  userId: string;
  summary: PublicProfileSummary | null;
}

export default async function NetworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const connections = new SupabaseConnectionRepository(supabase);
  const profiles = new SupabaseProfileRepository(supabase);

  const [incoming, accepted] = await Promise.all([
    connections.listIncomingPending(user.id),
    connections.listAccepted(user.id),
  ]);

  const requesterIds = incoming.map((c) => c.requesterId);
  const contactIds = accepted.map((c) => otherParty(c, user.id));
  const summaries = await profiles.loadPublicSummariesByIds([
    ...requesterIds,
    ...contactIds,
  ]);
  const byId = new Map(summaries.map((s) => [s.userId, s]));

  const requests: NetworkEntry[] = requesterIds.map((id) => ({
    userId: id,
    summary: byId.get(id) ?? null,
  }));
  const contacts: NetworkEntry[] = contactIds.map((id) => ({
    userId: id,
    summary: byId.get(id) ?? null,
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Nätverk
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Dina kontakter
        </h1>
      </header>

      <section aria-labelledby="requests-heading" className="mb-12">
        <h2 id="requests-heading" className="mb-4 text-xl font-semibold">
          Förfrågningar{" "}
          {requests.length > 0 && (
            <span className="text-[var(--color-muted)]">({requests.length})</span>
          )}
        </h2>
        {requests.length === 0 ? (
          <p className="text-[var(--color-muted)]">
            Inga väntande förfrågningar just nu.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((entry) => (
              <li
                key={entry.userId}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-line)] bg-white/50 p-4"
              >
                <EntryIdentity entry={entry} />
                <ConnectionActions userId={entry.userId} kind="request" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="contacts-heading">
        <h2 id="contacts-heading" className="mb-4 text-xl font-semibold">
          Kontakter{" "}
          {contacts.length > 0 && (
            <span className="text-[var(--color-muted)]">({contacts.length})</span>
          )}
        </h2>
        {contacts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
            <p className="text-lg leading-snug">Du har inga kontakter än.</p>
            <p className="mt-2 text-[var(--color-muted)]">
              Hitta någons profil via deras länk (/u/…) och klicka <b>Anslut</b>.
              När de accepterar dyker de upp här.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {contacts.map((entry) => (
              <li
                key={entry.userId}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-line)] bg-white/50 p-4"
              >
                <EntryIdentity entry={entry} />
                <ConnectionActions userId={entry.userId} kind="contact" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-12 text-sm text-[var(--color-muted)]">
        <a href="/profile" className="underline">
          ← Till din profil
        </a>
      </p>
    </main>
  );
}

/** Motpartens identitet: namn + headline + länk till profilen, eller en fallback. */
function EntryIdentity({ entry }: { entry: NetworkEntry }) {
  if (!entry.summary) {
    return (
      <div>
        <p className="font-medium">Elevantly-användare</p>
        <p className="text-sm text-[var(--color-muted)]">
          Profilen är inte offentlig.
        </p>
      </div>
    );
  }
  const { handle, displayName, headline } = entry.summary;
  return (
    <div className="min-w-0">
      <a href={`/u/${handle}`} className="font-medium underline">
        {displayName ?? `@${handle}`}
      </a>
      {headline && (
        <p className="truncate text-sm text-[var(--color-muted)]">{headline}</p>
      )}
    </div>
  );
}
