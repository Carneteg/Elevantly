/**
 * Förankringen, synlig för användaren: "Grundat på: ...". Varje påstående i
 * svaret bär detta — inget visas som fakta utan spårbar källa (CLAUDE.md 8.3).
 */
export function Grounded({ sourceText }: { sourceText: string }) {
  return (
    <p className="mt-2 text-sm text-[var(--color-muted)]">
      <span className="font-medium">Grundat på:</span>{" "}
      <span className="italic">”{sourceText}”</span>
    </p>
  );
}
