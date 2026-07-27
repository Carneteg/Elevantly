import { notFound, redirect } from "next/navigation";
import {
  StaticSkillTaxonomy,
  SupabaseCompanyRepository,
  SupabaseJobRepository,
} from "@elevantly/core";
import type { Job, JobStatus } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { JobPostForm } from "@/components/JobPostForm";
import { JobStatusActions } from "@/components/JobStatusActions";

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
              <JobRow key={job.id} job={job} labelById={labelById} />
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
}: {
  job: Job;
  labelById: Map<string, string>;
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
    </li>
  );
}
