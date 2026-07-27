import { notFound, redirect } from "next/navigation";
import {
  StaticSkillTaxonomy,
  SupabaseApplicationRepository,
  SupabaseCompanyRepository,
  SupabaseJobRepository,
} from "@elevantly/core";
import type { Application, ApplicationStatus, Job, JobStatus } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { DecisionList } from "@/components/DecisionList";
import { JobPostForm } from "@/components/JobPostForm";
import { JobStatusActions } from "@/components/JobStatusActions";
import { ApplicantActions } from "@/components/ApplicantActions";

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Inskickad",
  reviewing: "Granskas",
  accepted: "Antagen",
  declined: "Avböjd",
};

/**
 * Företagsdetalj (arbetsgivarvy) — hantera företagets jobb och posta nya. Skyddad;
 * bara medlemmar (RLS gör att `load` ger `null` annars → 404). Kraven väljs ur den
 * kanoniska taxonomin — inte fritext (CLAUDE.md 7.3).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<JobStatus, string> = {
  draft: "Utkast",
  published: "Publicerat",
  closed: "Stängt",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = await new SupabaseCompanyRepository(supabase).load(id);
  if (!company) notFound();

  const [jobs, skills] = await Promise.all([
    new SupabaseJobRepository(supabase).listByCompany(id),
    new StaticSkillTaxonomy().list(),
  ]);
  const skillOptions = skills.map((s) => ({ id: s.id, label: s.label }));
  const labelById = new Map(skills.map((s) => [s.id, s.label]));

  // Ansökningar per jobb (RLS: medlemmar ser företagets ansökningar).
  const applicationRepo = new SupabaseApplicationRepository(supabase);
  const applicationsByJob = new Map<string, Application[]>(
    await Promise.all(
      jobs.map(
        async (job) =>
          [job.id, await applicationRepo.listForJob(job.id)] as const,
      ),
    ),
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          <a href="/company" className="underline">
            Företag
          </a>{" "}
          / Arbetsgivarvy
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          {company.name}
        </h1>
        {company.summary && (
          <p className="mt-2 text-[var(--color-muted)]">{company.summary}</p>
        )}
        <a
          href="/recruiter/search"
          className="mt-4 inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
        >
          Sök kandidater →
        </a>
      </header>

      <section aria-labelledby="jobs-heading" className="mb-12">
        <h2 id="jobs-heading" className="mb-3 text-xl font-semibold">
          Era jobb
        </h2>
        {jobs.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-5 text-[var(--color-muted)]">
            Inga jobb än. Posta ert första nedan — kandidater matchas mot kraven,
            inte nyckelord.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                labelById={labelById}
                applications={applicationsByJob.get(job.id) ?? []}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="post-heading">
        <h2 id="post-heading" className="mb-3 text-xl font-semibold">
          Posta ett jobb
        </h2>
        <JobPostForm companyId={company.id} skills={skillOptions} />
      </section>
    </main>
  );
}

function JobRow({
  job,
  labelById,
  applications,
}: {
  job: Job;
  labelById: Map<string, string>;
  applications: Application[];
}) {
  const status = job.status ?? "published";
  const required = job.requiredSkillIds
    .map((sid) => labelById.get(sid) ?? sid)
    .join(", ");
  return (
    <li className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{job.title}</h3>
        <span className="mono rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          {STATUS_LABEL[status]}
        </span>
      </div>
      {required && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">Krav: {required}</p>
      )}
      <div className="mt-3">
        <JobStatusActions jobId={job.id} companyId={job.companyId ?? ""} status={status} />
      </div>

      <div className="mt-4 border-t border-[var(--color-line)] pt-4">
        <p className="text-sm font-medium">
          {applications.length === 0
            ? "Inga ansökningar än."
            : `${applications.length} ${applications.length === 1 ? "ansökan" : "ansökningar"}`}
        </p>
        {applications.length > 0 && (
          <ul className="mt-3 flex flex-col gap-4">
            {applications.map((app) => (
              <li
                key={app.id}
                className="rounded-xl border border-[var(--color-line)] bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {app.candidateName ?? "Kandidat"}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {APPLICATION_STATUS_LABEL[app.status]}
                  </span>
                </div>
                {app.candidateHeadline && (
                  <p className="text-sm text-[var(--color-muted)]">
                    {app.candidateHeadline}
                  </p>
                )}
                {app.message && (
                  <p className="mt-2 text-sm">{app.message}</p>
                )}
                {app.decisions.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      Grundad profil (ögonblicksbild)
                    </p>
                    <DecisionList decisions={app.decisions} />
                  </div>
                )}
                <div className="mt-3">
                  <ApplicantActions applicationId={app.id} status={app.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
