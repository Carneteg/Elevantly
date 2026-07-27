import { notFound, redirect } from "next/navigation";
import {
  SupabaseConnectionRepository,
  SupabaseMessageRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/MessageThread";

/**
 * En konversationstråd med en kontakt (/messages/handle). Skyddad. Man kan bara
 * öppna en tråd med en accepterad kontakt — annars 404 (ingen läcka om vem som
 * finns). Trådens live-uppdatering och sändning sköts av `MessageThread`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profiles = new SupabaseProfileRepository(supabase);
  const connections = new SupabaseConnectionRepository(supabase);
  const messages = new SupabaseMessageRepository(supabase);

  const otherId = await profiles.findUserIdByPublicHandle(handle);
  if (!otherId || otherId === user.id) notFound();

  // Bara accepterade kontakter kan ha en tråd.
  const connection = await connections.findBetween(user.id, otherId);
  if (!connection || connection.status !== "accepted") notFound();

  const [thread, summaries] = await Promise.all([
    messages.listThread(user.id, otherId),
    profiles.loadPublicSummariesByIds([otherId]),
  ]);
  const other = summaries[0] ?? null;
  const otherName = other?.displayName ?? `@${handle}`;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col px-6 py-8">
      <header className="mb-6 border-b border-[var(--color-line)] pb-4">
        <a href="/messages" className="text-sm text-[var(--color-muted)] underline">
          ← Samtal
        </a>
        <h1 className="mt-2 text-2xl font-semibold">
          <a href={`/u/${handle}`} className="hover:underline">
            {otherName}
          </a>
        </h1>
        {other?.headline && (
          <p className="text-sm text-[var(--color-muted)]">{other.headline}</p>
        )}
      </header>

      <MessageThread
        currentUserId={user.id}
        otherUserId={otherId}
        otherHandle={handle}
        otherName={otherName}
        initialMessages={thread}
      />
    </main>
  );
}
