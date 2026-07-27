import { redirect } from "next/navigation";
import { SupabaseProfileRepository } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { DecisionList } from "@/components/DecisionList";
import { ProfileEditor } from "@/components/ProfileEditor";
import { AccountData } from "@/components/AccountData";

/**
 * Din profil — den grundade, strukturerade kärnan som ackumuleras mellan besök.
 * Skyddad: kräver inloggning (annars vidare till /login). Läser bara dina egna
 * beslut (row-level security i Supabase gör att du aldrig når någon annans).
 */
export const runtime = "nodejs";
// Per-request: läser session-kakor och Supabase, ska aldrig förhandsrenderas.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const repository = new SupabaseProfileRepository(supabase);
  const profile = await repository.load(user.id);
  const decisions = profile?.decisions ?? [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Din profil
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Vad du faktiskt gjort
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{user.email}</p>
      </header>

      <section aria-labelledby="share-heading" className="mb-12">
        <h2 id="share-heading" className="mb-2 text-xl font-semibold">
          Din delbara profil
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Välj ett användarnamn och bestäm vem som ser profilen — bara du, dina
          kontakter, eller alla med länken. Den är privat tills du väljer annat.
        </p>
        <ProfileEditor
          initialHandle={profile?.handle ?? ""}
          initialDisplayName={profile?.displayName ?? ""}
          initialHeadline={profile?.headline ?? ""}
          initialVisibility={profile?.visibility ?? "private"}
        />
      </section>

      {decisions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
          <p className="text-lg leading-snug">Din profil är tom än så länge.</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Gå till Spegeln, beskriv vad du gjort i jobbet, och dina beslut
            samlas här — profilen växer för varje besök.
          </p>
          <a
            href="/"
            className="mt-4 inline-block rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
          >
            Öppna Spegeln
          </a>
        </div>
      ) : (
        <>
          <p className="mb-6 text-[var(--color-muted)]">
            {decisions.length}{" "}
            {decisions.length === 1 ? "beslut" : "beslut"} i din profil. Skriv mer
            i Spegeln för att bygga vidare.
          </p>
          <DecisionList decisions={decisions} />
          <p className="mt-10 text-sm text-[var(--color-muted)]">
            <a href="/" className="underline">
              ← Tillbaka till Spegeln
            </a>
          </p>
        </>
      )}

      <AccountData />
    </main>
  );
}
