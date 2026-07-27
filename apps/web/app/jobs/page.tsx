import { redirect } from "next/navigation";
import {
  matchJobs,
  StaticSkillTaxonomy,
  SupabaseJobRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { Confidence, JobMatch } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Jobb — "Vilka jobb passar det jag faktiskt gjort?" (roadmap pelare 6, fas 6a).
 * Smartare än en sökdjungel: jobb och kandidat beskrivs i EN kanonisk taxonomi, så
 * matchningen sker på begrepp och bevisade beslut — inte på nyckelord. Varje träff
 * visar exakt vad den vilar på (§8.3/§8.5). Ingen ansökan byggd än; detta är
 * kandidatvärdet först (§6.2). Seedade annonser tills arbetsgivare finns.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "låg",
  medium: "medel",
  high: "hög",
};

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await new SupabaseProfileRepository(supabase).load(user.id);
  const decisions = profile?.decisions ?? [];
  const [skills, jobs] = await Promise.all([
    new StaticSkillTaxonomy().list(),
    new SupabaseJobRepository(supabase).listPublished(),
  ]);
  const matches = matchJobs(decisions, jobs, skills);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Jobb
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Jobb som passar det du gjort
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Ingen sökdjungel. Vi matchar dina bevisade beslut mot jobbens faktiska
          krav — samma kompetens, oavsett vad den kallas. Varje träff visar varför.
        </p>
      </header>

      {decisions.length === 0 ? (
        <EmptyState
          title="Vi behöver något att utgå från."
          body="Beskriv vad du gjort i jobbet i Spegeln, så matchar vi dig mot jobb som faktiskt stämmer med din erfarenhet."
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Inga jobb är utlysta än."
          body="Så snart arbetsgivare publicerar jobb matchar vi dem mot dina beslut och visar exakt varför de passar. Har du ett företag kan du posta jobb själv."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="Inga träffar än."
          body="Dina beslut matchar inte de jobb som är utlysta just nu. Beskriv mer i Spegeln — fler grundade beslut ger fler och bättre träffar."
        />
      ) : (
        <>
          <p className="mb-6 text-[var(--color-muted)]">
            {matches.length} {matches.length === 1 ? "jobb" : "jobb"} med stöd i
            dina {decisions.length} beslut.
          </p>
          <ul className="flex flex-col gap-4">
            {matches.map((match) => (
              <JobCard key={match.job.id} match={match} />
            ))}
          </ul>
          <p className="mt-10 text-sm text-[var(--color-muted)]">
            Träffarna bygger på tolkningar av dina beslut, inte verifierade fakta.
            En startpunkt för dig att bedöma — inte en dom.
          </p>
        </>
      )}
    </main>
  );

  function JobCard({ match }: { match: JobMatch }) {
    const { job } = match;
    const meta = [job.location, job.remote ? "distans möjligt" : null]
      .filter(Boolean)
      .join(" · ");
    return (
      <li className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{job.title}</h2>
          <span className="text-sm text-[var(--color-muted)]">
            {match.requiredMatched}/{match.requiredTotal} krav
            {match.preferredMatched > 0
              ? ` · +${match.preferredMatched} meriterande`
              : ""}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          {job.company}
          {meta ? ` — ${meta}` : ""}
        </p>
        <p className="mt-2 text-[var(--color-muted)]">{job.summary}</p>

        <div className="mt-4">
          <p className="text-sm font-medium">Det här matchar:</p>
          <ul className="mt-2 flex flex-col gap-2">
            {match.evidence.map((ev, i) => (
              <li
                key={`${ev.skillId}-${i}`}
                className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm"
              >
                <span className="font-medium">{ev.skillLabel}</span>{" "}
                <span className="text-[var(--color-muted)]">
                  {ev.required ? "(krav)" : "(meriterande)"} — din kompetens “
                  {ev.userCapability}” (konfidens {CONFIDENCE_LABEL[ev.confidence]})
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
