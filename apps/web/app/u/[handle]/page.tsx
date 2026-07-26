import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  isValidHandle,
  normalizeHandle,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PublicProfile } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DecisionList } from "@/components/DecisionList";

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

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await loadPublicProfile(handle).catch(() => null);

  if (!profile) notFound();

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

      <footer className="mt-12 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-muted)]">
        <p>
          Byggd på grundad, strukturerad substans — inget visas som fakta utan
          spårbar källa.
        </p>
      </footer>
    </main>
  );
}
