import type {
  Confidence,
  Decision,
  ResponsibilityLevel,
} from "@elevantly/core";
import { evidenceTier } from "@elevantly/core";
import { Sources } from "./Sources";
import { EvidenceTag } from "./EvidenceTag";

/** Ärlig formulering av ansvarsnivå — höjer aldrig nivån, döljs vid "unknown". */
function responsibilityLabel(level: ResponsibilityLevel): string | null {
  switch (level) {
    case "participated":
      return "Du beskriver att du deltog i det här";
    case "contributed":
      return "Du beskriver att du bidrog till det här";
    case "led":
      return "Du beskriver att du ledde det här";
    case "owned":
      return "Du beskriver att du hade helhetsansvar för det här";
    case "unknown":
      return null;
  }
}

function confidenceLabel(confidence: Confidence): string {
  switch (confidence) {
    case "high":
      return "hög tilltro";
    case "medium":
      return "medel tilltro";
    case "low":
      return "låg tilltro";
  }
}

/**
 * Presentation av en lista beslut (t.ex. en profils ackumulerade kärna). Ren och
 * tillståndslös; samma ärlighetsregler som i speglingen — inget visas som fakta
 * utan spårbar källa.
 */
export function DecisionList({
  decisions,
  showEvidence = false,
}: {
  decisions: Decision[];
  /** Visa bevisgradering per prestation (Zon C på besökarens profilvy). */
  showEvidence?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-6">
      {decisions.map((decision, i) => (
        <li
          key={i}
          className="rounded-xl border border-[var(--color-line)] bg-white/50 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-lg leading-snug">{decision.action}</p>
            {showEvidence && <EvidenceTag tier={evidenceTier(decision)} />}
          </div>
          {responsibilityLabel(decision.responsibility) && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {responsibilityLabel(decision.responsibility)}
            </p>
          )}
          {decision.outcome && (
            <p className="mt-1 text-[var(--color-ink)]">
              <span className="text-[var(--color-muted)]">Utfall: </span>
              {decision.outcome}
            </p>
          )}
          {decision.capabilities.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-[var(--color-muted)]">
                Kompetenser detta kan peka på (AI-tolkning):
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {decision.capabilities.map((cap, j) => (
                  <li
                    key={j}
                    className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-muted)]"
                  >
                    {cap.name}
                    <span className="ml-1 opacity-70">
                      · {confidenceLabel(cap.confidence)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Sources kind={decision.kind} sources={decision.sources} />
        </li>
      ))}
    </ul>
  );
}
