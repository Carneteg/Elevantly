import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  isValidHandle,
  relationshipState,
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PublicProfile, RelationshipState } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DecisionList } from "@/components/DecisionList";
import { ConnectButton } from "@/components/ConnectButton";
import { ReportButton } from "@/components/ReportButton";

/**
 * Publik profilsida — /u/handle. Den delbara vyn av en persons grundade
 * identitet: namn, en kort headline och de beslut hen faktiskt beskrivit.
 *
 * Endast OFFENTLIGA profiler visas här (RLS + `loadPublicProfileByHandle`).
 * Privata, saknade eller ogiltiga handles ger 404 — ingen läcka om att en
 * profil finns men är privat. Ingen `userId` eller e-post exponeras någonsin:
 * vi läser `PublicProfile`, inte `StoredProfile` (CLAUDE.md 9).
 */
export const runtime = "nodejs";
// Per-request: läser Supabase, ska aldrig förhandsrenderas.
export const dynamic = "force-dynamic";

async function loadPublicProfile(
  handleParam: string,
): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured()) return null;
  if (!isValidHandle(handleParam)) return null;

  const supabase = await createClient();
  const repository = new SupabaseProfileRepository(supabase);
  return repository.loadPublicProfileByHandle(handleParam);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await loadPublicProfile(handle).catch(() => null);
  if (!profile) return { title: "Profil hittades inte — Elevantly" };

  const name = profile.displayName ?? `@${profile.handle}`;
  return {
    title: `${name} — Elevantly`,
    ...(profile.headline ? { description: profile.headline } : {}),
  };
}

/**
 * Räknar ut vilket tillstånd "Anslut"-knappen ska visa för den inloggade
 * besökaren gentemot profilägaren. `signed_out` om ingen är inloggad. Ägarens
 * userId löses upp på servern och skickas aldrig till klienten.
 */
async function loadConnectState(
  handle: string,
): Promise<RelationshipState | "signed_out"> {
  if (!isSupabaseConfigured()) return "signed_out";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "signed_out";

    const profiles = new SupabaseProfileRepository(supabase);
    const ownerId = await profiles.findUserIdByPublicHandle(handle);
    if (!ownerId) return "signed_out";
    if (ownerId === user.id) return "self";

    const connections = new SupabaseConnectionRepository(supabase);
    const connection = await connections.findBetween(user.id, ownerId);
    return relationshipState(connection, user.id, ownerId);
  } catch {
    return "signed_out";
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await loadPublicProfile(handle).catch(() => null);

  if (!profile) notFound();

  const connectState = await loadConnectState(handle);
  const name = profile.displayName ?? `@${profile.handle}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          @{profile.handle}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          {name}
        </h1>
        {profile.headline && (
          <p className="mt-2 text-lg text-[var(--color-muted)]">
            {profile.headline}
          </p>
        )}
        <div className="mt-5">
          <ConnectButton handle={profile.handle} initialState={connectState} />
        </div>
      </header>

      <section aria-label="Beslut och utfall">
        {profile.decisions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
            <p className="text-lg leading-snug">
              {name} har inte delat några beslut än.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Vad {name} faktiskt gjort
            </h2>
            <DecisionList decisions={profile.decisions} />
          </>
        )}
      </section>

      <footer className="mt-12 flex items-start justify-between gap-4 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-muted)]">
        <p className="max-w-md">
          Byggd på grundad, strukturerad substans — inget visas som fakta utan
          spårbar källa.
        </p>
        {connectState !== "self" && connectState !== "signed_out" && (
          <ReportButton subjectType="profile" subjectId={profile.handle} />
        )}
      </footer>
    </main>
  );
}
