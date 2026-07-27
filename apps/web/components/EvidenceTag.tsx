import type { EvidenceTier } from "@elevantly/core";

/**
 * Bevisgradering som en liten, ärlig tagg (roadmap Fas 7). Vi gömmer aldrig svaga
 * påståenden — vi märker dem (CLAUDE.md 8.3/11). v1 renderar i praktiken bara
 * "självrapporterat"; kontextförankrat/attesterat aktiveras när de funktionerna byggs.
 */
const TIER: Record<
  EvidenceTier,
  { glyph: string; label: string; className: string }
> = {
  self_reported: {
    glyph: "○",
    label: "självrapporterat",
    className: "text-[var(--color-muted)] border-[var(--color-line)]",
  },
  context_anchored: {
    glyph: "◐",
    label: "kontextförankrat",
    className: "text-[var(--color-accent)] border-[var(--color-accent)]/40",
  },
  attested: {
    glyph: "●",
    label: "attesterat",
    className: "text-[var(--color-accent)] border-[var(--color-accent)]",
  },
};

export function EvidenceTag({ tier }: { tier: EvidenceTier }) {
  const t = TIER[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs ${t.className}`}
      title={
        tier === "self_reported"
          ? "Vilar på personens egna ord — ännu obestyrkt."
          : undefined
      }
    >
      <span aria-hidden="true">{t.glyph}</span>
      {t.label}
    </span>
  );
}
