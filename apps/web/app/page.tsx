import { Spegeln } from "@/components/Spegeln";

/**
 * Spegeln — startskärmen. Ett tydligt fokus: beskriv vad du gjort, få tillbaka
 * vad det säger om vad du är bra på och vilka roller det pekar mot. Navigering
 * (profil, nätverk, inloggning) ligger i den globala toppnaven.
 */
export default function Page() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center px-6 py-16">
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
