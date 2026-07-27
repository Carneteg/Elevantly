import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  acceptedDecisionKeys,
  isValidHandle,
  outcomeCoverage,
  relationshipState,
  remainingBudget,
  SupabaseAttestationRepository,
  SupabaseBlockRepository,
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PublicProfile, RelationshipState } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DecisionList } from "@/components/DecisionList";
import type { AttesterNote } from "@/components/DecisionList";
import { ConnectButton } from "@/components/ConnectButton";
import { AttestButton } from "@/components/AttestButton";
import { ReportButton } from "@/components/ReportButton";
import { BlockButton } from "@/components/BlockButton";

/**
 * Publik profilsida — /u/handle. Den delbara vyn av en persons grundade
 * identitet: namn, en kort headline och de beslut hen faktiskt beskrivit.
 *
 * Visar en profil som betraktaren FÅR se (RLS + `loadVisibleProfileByHandle`):
 * offentlig för alla, `contacts` för en accepterad kontakt, eller ens egen.
 * Privata, dolda, saknade eller ogiltiga handles ger 404 — ingen läcka om att en
 * profil finns men är dold. Ingen `userId` eller e-post exponeras någonsin:
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
  // RLS avgör: offentlig för alla, `contacts` för en accepterad kontakt, egen.
  return repository.loadVisibleProfileByHandle(handleParam);
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

interface ViewerContext {
  connectState: RelationshipState | "signed_out";
  iBlocked: boolean;
  /** Får besökaren attestera ägarens beslut? (accepterad kontakt, ej blockerad.) */
  canAttest: boolean;
  /** Hur många attesteringar besökaren har kvar att ge (knapphet). */
  remainingAttestations: number;
}

/**
 * Räknar ut den inloggade besökarens läge gentemot profilägaren: vilket tillstånd
 * "Anslut"-knappen ska visa, om besökaren har blockerat ägaren, och om besökaren
 * får attestera (en accepterad kontakt) samt hur många attesteringar hen har kvar.
 * `signed_out` om ingen är inloggad. Ägarens userId löses upp på servern och
 * skickas aldrig till klienten.
 */
async function loadViewerContext(handle: string): Promise<ViewerContext> {
  const signedOut: ViewerContext = {
    connectState: "signed_out",
    iBlocked: false,
    canAttest: false,
    remainingAttestations: 0,
  };
  if (!isSupabaseConfigured()) return signedOut;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return signedOut;

    const profiles = new SupabaseProfileRepository(supabase);
    // Löser upp ägaren om betraktaren får se profilen (offentlig eller kontakt).
    const ownerId = await profiles.findUserIdByVisibleHandle(handle);
    if (!ownerId) return signedOut;
    if (ownerId === user.id) {
      return { ...signedOut, connectState: "self" };
    }

    const blocks = new SupabaseBlockRepository(supabase);
    const connections = new SupabaseConnectionRepository(supabase);
    const [iBlocked, connection] = await Promise.all([
      blocks.hasBlocked(user.id, ownerId),
      connections.findBetween(user.id, ownerId),
    ]);
    const connectState = relationshipState(connection, user.id, ownerId);
    const canAttest = connectState === "connected" && !iBlocked;

    let remainingAttestations = 0;
    if (canAttest) {
      const attestations = new SupabaseAttestationRepository(supabase);
      const active = await attestations.countActiveGivenBy(user.id);
      remainingAttestations = remainingBudget(active);
    }

    return { connectState, iBlocked, canAttest, remainingAttestations };
  } catch {
    return signedOut;
  }
}

/**
 * Godkända intyg om en profils beslut, färdiga för visning: vilka beslutsnycklar
 * som är attesterade (driver bevisgraden) och vem+motivering per nyckel.
 * Definer-funktionen släpper bara igenom rader om betraktaren får se profilen.
 * Attesterarens namn/handle visas bara om deras egen profil är offentlig — vi
 * läcker aldrig en privat identitet (§9), men motiveringen (substansen) visas alltid.
 */
async function loadAttestationDisplay(handle: string): Promise<{
  attestedKeys: Set<string>;
  notesByKey: Map<string, AttesterNote[]>;
}> {
  const empty = { attestedKeys: new Set<string>(), notesByKey: new Map() };
  if (!isSupabaseConfigured()) return empty;
  try {
    const supabase = await createClient();
    const profiles = new SupabaseProfileRepository(supabase);
    const ownerId = await profiles.findUserIdByVisibleHandle(handle);
    if (!ownerId) return empty;

    const attestations = new SupabaseAttestationRepository(supabase);
    const accepted = await attestations.listAcceptedForSubject(ownerId);
    if (accepted.length === 0) return empty;

    const attesterIds = [...new Set(accepted.map((a) => a.attesterUserId))];
    const summaries = await profiles.loadPublicSummariesByIds(attesterIds);
    const byId = new Map(summaries.map((s) => [s.userId, s]));

    const notesByKey = new Map<string, AttesterNote[]>();
    for (const a of accepted) {
      const summary = byId.get(a.attesterUserId);
      const note: AttesterNote = {
        name: summary?.displayName ?? null,
        handle: summary?.handle ?? null,
        motivation: a.motivation,
      };
      const list = notesByKey.get(a.decisionKey) ?? [];
      list.push(note);
      notesByKey.set(a.decisionKey, list);
    }
    return { attestedKeys: acceptedDecisionKeys(accepted), notesByKey };
  } catch {
    return empty;
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

  const [{ connectState, iBlocked, canAttest, remainingAttestations }, attest] =
    await Promise.all([
      loadViewerContext(handle),
      loadAttestationDisplay(handle),
    ]);
  const name = profile.displayName ?? `@${profile.handle}`;
  const signedInVisitor =
    connectState !== "self" && connectState !== "signed_out";

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
          <p className="mt-2 font-mono text-sm tracking-wide text-[var(--color-muted)]">
            {profile.headline}
          </p>
        )}
        {profile.decisions.length > 0 &&
          (() => {
            const { total, withOutcome } = outcomeCoverage(profile.decisions);
            return (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                <span className="font-medium text-[var(--color-ink)]">
                  {withOutcome} av {total}
                </span>{" "}
                {total === 1 ? "prestation" : "prestationer"} har kopplat utfall.
                Ingen fåfänge-statistik — bara vad som faktiskt beskrivits.
              </p>
            );
          })()}
        <div className="mt-5">
          {iBlocked ? (
            <p className="text-sm text-[var(--color-muted)]">
              Du har blockerat den här personen. Ni kan inte kontakta varandra.
            </p>
          ) : (
            <ConnectButton handle={profile.handle} initialState={connectState} />
          )}
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
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Vad {name} faktiskt gjort
            </h2>
            <p className="mb-6 text-sm text-[var(--color-muted)]">
              Varje prestation bär sin bevisgrad. ○ självrapporterat vilar på
              personens egna ord; ● attesterat betyder att en kontakt har intygat det
              och att {name} har godkänt intyget.
            </p>
            <DecisionList
              decisions={profile.decisions}
              showEvidence
              attestedKeys={attest.attestedKeys}
              notesByKey={attest.notesByKey}
              {...(canAttest
                ? {
                    renderAttest: (decisionKey, decisionAction) => (
                      <AttestButton
                        handle={profile.handle}
                        decisionKey={decisionKey}
                        decisionAction={decisionAction}
                        remaining={remainingAttestations}
                      />
                    ),
                  }
                : {})}
            />
          </>
        )}
      </section>

      <footer className="mt-12 flex items-start justify-between gap-4 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-muted)]">
        <p className="max-w-md">
          Byggd på grundad, strukturerad substans — inget visas som fakta utan
          spårbar källa.
        </p>
        {signedInVisitor && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ReportButton subjectType="profile" subjectId={profile.handle} />
            <BlockButton handle={profile.handle} initiallyBlocked={iBlocked} />
          </div>
        )}
      </footer>
    </main>
  );
}
