import type { Decision } from "./decision";

/**
 * Stabil identitet för ett beslut — systemets enda definition av "samma beslut".
 * Härledd ur handlingen + dess källor (skiftläges- och whitespace-okänsligt,
 * källordning spelar ingen roll). Samma nyckel som dedupliceringen vilar på
 * (`mergeDecisions`), så attestering och deduplicering aldrig kan glida isär.
 *
 * Att identiteten är innehållsbaserad är ett medvetet, ärligt val: en attestering
 * gäller den EXAKTA formuleringen den gavs för. Ändras handlingens ordalydelse är
 * det per definition ett annat beslut (samma regel som dedupliceringen) — en gammal
 * attestering följer då inte med, vilket är korrekt: intyget gällde det som stod då.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function decisionIdentity(decision: Decision): string {
  const action = normalize(decision.action);
  const sources = decision.sources.map(normalize).sort().join("||");
  return `${action}##${sources}`;
}
