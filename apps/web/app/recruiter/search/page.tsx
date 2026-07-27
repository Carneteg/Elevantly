import { redirect } from "next/navigation";
import {
  acceptedDecisionKeys,
  canonicalizeTerm,
  decisionIdentity,
  searchCandidates,
  StaticSkillTaxonomy,
  SupabaseAttestationRepository,
  SupabaseCompanyRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type {
  CandidateInput,
  CandidateMatch,
  Confidence,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Rekryterarsök — "Vilka människor har BEVISAD erfarenhet av en kompetens?"
 * (roadmap Fas 7, Del 4). Skillnaden mot en LinkedIn-sökdjungel: vi rankar på
 * strukturerade, bevisade beslut och kan filtrera på ATTESTERAD erfarenhet, inte
 * på fåfänge-siffror (CLAUDE.md 3/6.5/11). Två grindar skyddar individen:
 * profilen måste vara offentlig OCH aktivt ha valt att synas i sök (§9.3), och
 * bara företagsmedlemmar (arbetsgivarsidan) når den här ytan.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "låg",
  medium: "medel",
  high: "hög",
};

/**
 * Attesteringar läses per person (ingen batch-väg finns), så vi hämtar dem bara
 * för de högst rankade träffarna. Filtret "endast attesterad" gäller därför inom
 * denna topp — en ärlig avgränsning som visas för rekryteraren (uppgraderas när
 * volymen kräver en batch-väg).
 */
const ATTESTATION_SLICE = 25;

/** En träff redo att visas — utan userId (som aldrig lämnar servern). */
interface ResultView {
  handle: string;
  displayName: string | null;
  headline: string | null;
  confidence: Confidence;
  userCapability: string;
  skillLabel: string;
  fromActions: string[];
  attested: boolean;
}

export default async function RecruiterSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; attested?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Grind: bara företagsmedlemmar (arbetsgivarsidan). Samma RLS-gräns som /company
  // — listForUser returnerar bara företag betraktaren är medlem i.
  const companies = await new SupabaseCompanyRepository(supabase).listForUser(
    user.id,
  );
  if (companies.length === 0) redirect("/company");

  const { skill: skillParam, attested: attestedParam } = await searchParams;
  const query = (skillParam ?? "").trim();
  const attestedOnly = attestedParam === "1";

  const search = query
    ? await runSearch(supabase, query, attestedOnly)
    : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Rekrytera
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Hitta människor på det de bevisat
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Sök på en kompetens. Vi rankar kandidater efter grundade beslut — inte
          nyckelord eller följarsiffror — och visar exakt vad varje träff vilar
          på. Bara profiler som själva valt att synas i sök listas.
        </p>
      </header>

      <SearchForm query={query} attestedOnly={attestedOnly} />

      {search === null ? (
        <EmptyState
          title="Börja med en kompetens."
          body="T.ex. “produktledning”, “frontend” eller “ledarskap”. Vi tolkar termen till ett kanoniskt begrepp och matchar den mot kandidaternas bevisade beslut."
        />
      ) : !search.recognized ? (
        <EmptyState
          title="Vi känner inte igen den kompetensen än."
          body="Taxonomin är medvetet kurerad så att matchningen sker på begrepp, inte på lösa ord. Prova en närliggande term — vi hittar hellre inget än hittar på en träff."
        />
      ) : search.results.length === 0 ? (
        <EmptyState
          title={`Inga kandidater för ${search.label} än.`}
          body={
            attestedOnly
              ? "Ingen av de högst rankade kandidaterna har ett attesterat beslut för den här kompetensen. Stäng av filtret för att se självrapporterad erfarenhet också."
              : "Ingen profil som valt att synas i sök har bevisade beslut inom den här kompetensen ännu."
          }
        />
      ) : (
        <>
          <p className="mb-6 text-[var(--color-muted)]">
            {search.results.length}{" "}
            {search.results.length === 1 ? "kandidat" : "kandidater"} för{" "}
            <span className="font-medium text-[var(--color-ink)]">
              {search.label}
            </span>
            {attestedOnly ? " med attesterad erfarenhet" : ""}.
          </p>
          <ul className="flex flex-col gap-4">
            {search.results.map((r) => (
              <CandidateCard key={r.handle} result={r} />
            ))}
          </ul>
          <p className="mt-10 text-sm text-[var(--color-muted)]">
            Rankningen bygger på tolkningar av kandidaternas egna beslut, inte på
            verifierade fakta. Ett ● betyder att en kontakt intygat just det
            beslutet. Attesteringsfiltret gäller de högst rankade träffarna.
          </p>
        </>
      )}
    </main>
  );
}

/**
 * Kör själva sökningen: kanoniserar termen, rankar de opt-in-profiler som finns,
 * och berikar toppskivan med attesterad-status för den sökta kompetensen. Aldrig
 * en krasch — attesteringsläsning per person sväljs till "ej attesterad".
 */
async function runSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  attestedOnly: boolean,
): Promise<{ recognized: boolean; label: string; results: ResultView[] }> {
  const skills = await new StaticSkillTaxonomy().list();
  const recognized = canonicalizeTerm(query, skills);
  if (!recognized) return { recognized: false, label: query, results: [] };

  const profiles = new SupabaseProfileRepository(supabase);
  const discoverable = await profiles.listDiscoverableProfiles();
  const byHandle = new Map(discoverable.map((p) => [p.handle, p]));

  const candidates: CandidateInput[] = discoverable.map((p) => ({
    ref: p.handle,
    decisions: p.decisions,
  }));
  const matches = searchCandidates(candidates, query, skills);

  const attestations = new SupabaseAttestationRepository(supabase);
  const slice = matches.slice(0, ATTESTATION_SLICE);
  const enriched = await Promise.all(
    slice.map((match) => toResult(match, byHandle, attestations)),
  );

  const results = enriched
    .filter((r): r is ResultView => r !== null)
    .filter((r) => (attestedOnly ? r.attested : true));

  return { recognized: true, label: recognized.label, results };
}

/**
 * Bygger en visningsklar träff och avgör om kandidaten har ett ATTESTERAT beslut
 * för just den sökta kompetensen: ett av kandidatens beslut som både bidrog till
 * matchen (`fromActions`) och har en godkänd attestering (`decisionIdentity`).
 */
async function toResult(
  match: CandidateMatch,
  byHandle: Map<
    string,
    Awaited<ReturnType<SupabaseProfileRepository["listDiscoverableProfiles"]>>[number]
  >,
  attestations: SupabaseAttestationRepository,
): Promise<ResultView | null> {
  const profile = byHandle.get(match.ref);
  const evidence = match.evidence[0];
  if (!profile || !evidence) return null;

  let attestedKeys = new Set<string>();
  try {
    const accepted = await attestations.listAcceptedForSubject(profile.userId);
    attestedKeys = acceptedDecisionKeys(accepted);
  } catch {
    attestedKeys = new Set<string>();
  }

  const fromActions = new Set(evidence.fromActions);
  const attested = profile.decisions.some(
    (d) => fromActions.has(d.action) && attestedKeys.has(decisionIdentity(d)),
  );

  return {
    handle: profile.handle,
    displayName: profile.displayName,
    headline: profile.headline,
    confidence: match.confidence,
    userCapability: evidence.userCapability,
    skillLabel: evidence.skillLabel,
    fromActions: evidence.fromActions,
    attested,
  };
}

function SearchForm({
  query,
  attestedOnly,
}: {
  query: string;
  attestedOnly: boolean;
}) {
  return (
    <form
      method="get"
      action="/recruiter/search"
      className="mb-10 flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white/50 p-5"
    >
      <label htmlFor="skill" className="text-sm font-medium">
        Kompetens
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="skill"
          name="skill"
          type="text"
          defaultValue={query}
          placeholder="T.ex. produktledning"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]"
        />
        <button
          type="submit"
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
        >
          Sök
        </button>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="attested"
          value="1"
          defaultChecked={attestedOnly}
        />
        <span>Endast attesterad erfarenhet (●)</span>
      </label>
    </form>
  );
}

function CandidateCard({ result }: { result: ResultView }) {
  const name = result.displayName ?? result.handle;
  return (
    <li className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <a href={`/u/${result.handle}`} className="text-xl font-semibold underline">
          {name}
        </a>
        {result.attested && (
          <span className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]">
            ● Attesterad erfarenhet
          </span>
        )}
      </div>
      {result.headline && (
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          {result.headline}
        </p>
      )}

      <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm">
        <span className="font-medium">{result.skillLabel}</span>{" "}
        <span className="text-[var(--color-muted)]">
          — kompetens “{result.userCapability}” (konfidens{" "}
          {CONFIDENCE_LABEL[result.confidence]})
        </span>
        <p className="mt-1 text-[var(--color-muted)]">
          Från: {result.fromActions.join("; ")}
        </p>
      </div>
    </li>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
      <p className="text-lg leading-snug">{title}</p>
      <p className="mt-2 text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
