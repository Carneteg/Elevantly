import { notFound, redirect } from "next/navigation";
import { SupabaseReportRepository } from "@elevantly/core";
import type { Report } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Granskningskö (admin). Rapporter är en envägssignal in till mänsklig
 * granskning (CLAUDE.md 11) — ingen automatik. Åtkomst är snäv: kräver inloggning
 * OCH admin-roll (`is_admin()` i DB). RLS är den egentliga spärren; kontrollen
 * här ger bara en ärlig 404 för icke-granskare, så sidan aldrig avslöjar sig.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<Report["subjectType"], string> = {
  profile: "Profil",
  post: "Inlägg",
  message: "Meddelande",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();

  const reports = await new SupabaseReportRepository(supabase).listForReview();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Granskning
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Rapporter
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Flaggat innehåll att granska, nyast först. Ingen åtgärd sker
          automatiskt — det här är en signal för ett mänskligt beslut.
        </p>
      </header>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
          <p className="text-lg">Inget att granska.</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Nya rapporter dyker upp här när användare flaggar något.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs font-medium text-white">
                  {SUBJECT_LABEL[report.subjectType]}
                </span>
                <time
                  dateTime={report.createdAt}
                  className="text-sm text-[var(--color-muted)]"
                >
                  {new Date(report.createdAt).toLocaleString("sv-SE")}
                </time>
              </div>

              <p className="mt-3 text-sm">
                <span className="text-[var(--color-muted)]">Objekt: </span>
                {report.subjectType === "profile" ? (
                  <a
                    href={`/u/${report.subjectId}`}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    /u/{report.subjectId} ↗
                  </a>
                ) : (
                  <code className="rounded bg-white px-1.5 py-0.5">
                    {report.subjectId}
                  </code>
                )}
              </p>

              {report.reason && (
                <p className="mt-2 text-sm">
                  <span className="text-[var(--color-muted)]">Motivering: </span>
                  {report.reason}
                </p>
              )}

              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Rapporterad av {report.reporterId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
