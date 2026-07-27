import { redirect } from "next/navigation";
import {
  matchRoles,
  StaticRoleCatalog,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { Confidence, RoleMatch } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Möjligheter — "Vilka roller passar det jag faktiskt gjort?" (roadmap fas 5).
 * Grundat och ärligt: vi matchar användarens beslut/kompetenser mot rollarketyper
 * och visar bara riktningar med spårbart stöd (CLAUDE.md 7.2, 8.3). Ingen jämförelse
 * med andra, inga fåfänge-siffror (CLAUDE.md 11) — bara riktning ur egen substans.
 * Ger värde även utan nätverk (CLAUDE.md 6.2).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "låg",
  medium: "medel",
  high: "hög",
};

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await new SupabaseProfileRepository(supabase).load(user.id);
  const decisions = profile?.decisions ?? [];
  const roles = await new StaticRoleCatalog().list();
  const matches = matchRoles(decisions, roles);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Möjligheter
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Riktningar som passar det du gjort
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Utifrån dina egna beslut — inte en titel du skrivit. Varje förslag visar
          exakt vad det vilar på, så du kan lita på det.
        </p>
      </header>

      {decisions.length === 0 ? (
        <EmptyState
          title="Vi behöver något att utgå från."
          body="Beskriv vad du gjort i jobbet i Spegeln, så pekar vi ut riktningar som faktiskt stämmer med din erfarenhet."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="Inga tydliga riktningar än."
          body="Dina beslut pekar inte entydigt mot någon av rollerna vi känner till ännu. Beskriv mer i Spegeln — fler grundade beslut ger tydligare riktningar."
        />
      ) : (
        <>
          <p className="mb-6 text-[var(--color-muted)]">
            {matches.length}{" "}
            {matches.length === 1 ? "riktning" : "riktningar"} med stöd i dina{" "}
            {decisions.length} beslut.
          </p>
          <ul className="flex flex-col gap-4">
            {matches.map((match) => (
              <RoleCard key={match.role.id} match={match} />
            ))}
          </ul>
          <p className="mt-10 text-sm text-[var(--color-muted)]">
            Förslagen bygger på tolkningar av dina beslut, inte verifierade fakta.
            De är en startpunkt för dig att bedöma — inte en dom.
          </p>
        </>
      )}
    </main>
  );

  function RoleCard({ match }: { match: RoleMatch }) {
    return (
      <li className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{match.role.title}</h2>
          <span className="text-sm text-[var(--color-muted)]">
            {match.matchedCount} av {match.totalCount} kärnkompetenser
          </span>
        </div>
        <p className="mt-1 text-[var(--color-muted)]">{match.role.summary}</p>

        <div className="mt-4">
          <p className="text-sm font-medium">Det här stödjer riktningen:</p>
          <ul className="mt-2 flex flex-col gap-2">
            {match.evidence.map((ev, i) => (
              <li
                key={`${ev.roleCapability}-${i}`}
                className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm"
              >
                <span className="font-medium">{ev.roleCapability}</span>{" "}
                <span className="text-[var(--color-muted)]">
                  — din kompetens “{ev.userCapability}” (konfidens{" "}
                  {CONFIDENCE_LABEL[ev.confidence]})
                </span>
                <p className="mt-1 text-[var(--color-muted)]">
                  Från: {ev.fromActions.join("; ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  }
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
      <p className="text-lg leading-snug">{title}</p>
      <p className="mt-2 text-[var(--color-muted)]">{body}</p>
      <a
        href="/"
        className="mt-4 inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
      >
        Öppna Spegeln
      </a>
    </div>
  );
}
