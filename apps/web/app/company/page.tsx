import { redirect } from "next/navigation";
import { SupabaseCompanyRepository } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { CreateCompanyForm } from "@/components/CreateCompanyForm";

/**
 * Företag (arbetsgivare) — dina företag och att skapa nya. Skyddad; kräver
 * inloggning. Row-level security gör att du bara ser företag du är medlem i
 * (CLAUDE.md 9). Nästa steg (6b-2): posta och hantera jobb per företag.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companies = await new SupabaseCompanyRepository(supabase).listForUser(
    user.id,
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Arbetsgivare
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Dina företag
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Skapa ett företag för att kunna annonsera jobb. Kandidater matchas mot
          jobbens faktiska krav — inte nyckelord.
        </p>
      </header>

      {companies.length > 0 && (
        <section aria-label="Dina företag" className="mb-12">
          <ul className="flex flex-col gap-3">
            {companies.map((company) => (
              <li
                key={company.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">{company.name}</h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    Jobb kommer snart
                  </span>
                </div>
                {company.summary && (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {company.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="create-heading">
        <h2 id="create-heading" className="mb-3 text-xl font-semibold">
          {companies.length > 0 ? "Skapa ett till" : "Skapa ditt första företag"}
        </h2>
        <CreateCompanyForm />
      </section>
    </main>
  );
}
