import type { ClaimKind } from "@elevantly/core";

/**
 * Förankringen, synlig för användaren — men ärlig om vad den bevisar.
 * Ett citat visar att texten finns, inte att en slutsats följer av den.
 * Därför styr `kind` etiketten (CLAUDE.md 8.3):
 *  - "quote"          → "Du skrev:" (användarens egna ord)
 *  - "interpretation" → "Tolkat från:" (AI:ns tolkning härledd från citatet)
 * Vi använder aldrig en platt "Grundat på" som antyder validering.
 */
export function Sources({
  kind,
  sources,
}: {
  kind: ClaimKind;
  sources: string[];
}) {
  const label = kind === "quote" ? "Du skrev:" : "Tolkat från:";

  return (
    <div className="mt-2 text-sm text-[var(--color-muted)]">
      <span className="font-medium">{label}</span>
      <ul className="mt-1 flex flex-col gap-1">
        {sources.map((source, i) => (
          <li key={i} className="italic">
            ”{source}”
          </li>
        ))}
      </ul>
    </div>
  );
}
