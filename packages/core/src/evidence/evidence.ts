import type { Decision } from "../decision";

/**
 * Bevisgradering (roadmap Fas 7). Hela produktens kil är "bevisat, inte påstått"
 * (produktstrategin). Men verkligheten är gråskalig, så vi visar HUR underbyggt ett
 * påstående är — vi gömmer aldrig svaga påståenden, vi märker dem (CLAUDE.md 8.3/11).
 *
 * - `self_reported`    Personen har sagt det, förankrat i egna ord. Ärligt märkt som obestyrkt.
 * - `context_anchored` Länkad mätning/tidslinje/dokument gör det troligt. (Aktiveras senare.)
 * - `attested`         En kontakt i nätverket har intygat det, med motivering. (Aktiveras senare.)
 *
 * Knyter an till `ClaimKind` (`quote`/`interpretation`/`verified`). Sätts av
 * PRODUKTLOGIKEN, aldrig av AI-motorn — samma mönster som `kind`/`responsibility`.
 */
export type EvidenceTier = "self_reported" | "context_anchored" | "attested";

/**
 * Härleder bevisgraden för ett beslut, deterministiskt. v1: allt är `self_reported`
 * — det finns ännu varken kontextlänkar eller attesteringar i modellen, så en
 * ärlig produkt märker alla prestationer som obestyrkta (en helt "grå" profil är i
 * sig ärlig information till en rekryterare). När kontextlänkning och attestering
 * byggs uppgraderas härledningen här — inga andra ytor behöver ändras.
 */
export function evidenceTier(_decision: Decision): EvidenceTier {
  return "self_reported";
}

/**
 * Sammanfattar hur många prestationer som har ett kopplat utfall — driver den lugna
 * förtroendeindikatorn på profilen ("X av Y prestationer har kopplat utfall"). Rent
 * och ärligt: räknar bara det som faktiskt finns (ett `outcome`), utan att värdera
 * det som verifierat. Muterar inte indata.
 */
export function outcomeCoverage(decisions: Decision[]): {
  total: number;
  withOutcome: number;
} {
  const withOutcome = decisions.filter(
    (d) => typeof d.outcome === "string" && d.outcome.trim().length > 0,
  ).length;
  return { total: decisions.length, withOutcome };
}
