import { Spegeln } from "@/components/Spegeln";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Spegeln — startskärmen. Ett tydligt fokus: beskriv vad du gjort, få tillbaka
 * vad det säger om vad du är bra på och vilka roller det pekar mot. Är konton
 * påslagna finns en diskret länk till din profil.
 */
export default function Page() {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      {isSupabaseConfigured() && (
        <nav className="absolute right-6 top-6">
          <a
            href="/profile"
            className="text-sm text-[var(--color-muted)] underline transition hover:text-[var(--color-ink)]"
          >
            Min profil
          </a>
        </nav>
      )}
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Spegeln
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Beskriv vad du faktiskt gjort i jobbet.
        </h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          Jag speglar tillbaka vad det säger om vad du är bra på — och vilka
          roller det pekar mot.
        </p>
      </header>

      <Spegeln />
    </main>
  );
}
