import type { Decision } from "../decision";
import type {
  GroundedClaim,
  Reflection,
  RoleSuggestion,
} from "../reflection";
import type { RawReflection } from "../ai/engine";

/**
 * Struktureringens hjärta: gör ett rått AI-svar till en förankringsvaliderad
 * Reflection. HELT deterministisk och nätverksfri — därför testbar utan
 * riktig motor. Den upprätthåller CLAUDE.md 8.3: inget påstående får visas
 * som fakta utan spårbar källa i användarens egen text.
 *
 * Förankringen är NÖDVÄNDIG men inte tillräcklig: ett citat bevisar bara att
 * texten finns, inte att slutsatsen följer av den. Därför sätter denna funktion
 * också `kind` (deterministiskt, aldrig från motorn) så att UI:t kan vara
 * ärligt om vad som är användarens ord och vad som är AI:ns tolkning.
 *
 * Robusthet: funktionen kastar ALDRIG. Trasig, ofullständig eller orimligt stor
 * input degraderar säkert — poster utan spårbar källa filtreras bort, och
 * antal/längder kapas mot hårda gränser (se PARSE_LIMITS) så att inget svar kan
 * bli orimligt stort. Den deterministiska förankringskontrollen är oförändrad:
 * grundning utvärderas alltid på det fullständiga citatet, trunkering sker först
 * efteråt (för visning).
 */

/** Standardfråga om motorn inte gav en egen (copilot-känsla ska aldrig saknas). */
const DEFAULT_FOLLOW_UP =
  "Vill du berätta om en situation där du löste något som var svårare än det såg ut?";

/**
 * Hårda, konservativa gränser. Överskott trunkeras (aldrig krasch). Syftet är
 * robusthet — inte att forma innehållet — så värdena är generöst tilltagna.
 */
export const PARSE_LIMITS = {
  maxDecisions: 20,
  maxStrengths: 10,
  maxRoles: 10,
  maxCapabilitiesPerDecision: 10,
  maxSourcesPerItem: 5,
  /** Max längd för textfält (action, statement, role, rationale, context, outcome). */
  maxFieldLength: 500,
  /** Max längd för ett enskilt citat (visas trunkerat, grundning sker på fulltext). */
  maxSourceLength: 600,
  /** Max längd för en enskild capability-etikett. */
  maxCapabilityLength: 100,
  /** Max längd på uppföljningsfrågan. */
  maxFollowUpLength: 300,
  /**
   * Hur många råa poster per lista som ÖVERHUVUDTAGET granskas. Skyddar mot att
   * en orimligt stor array av ogiltiga poster tvingar fram dyr O(n·m)-grundning.
   * Överskott ignoreras (trunkeras).
   */
  maxScanItems: 200,
  /** Hur många citatkandidater per post som granskas innan grundning. */
  maxSourceCandidates: 25,
} as const;

/** Trunkerar till maxLength inkl. ellips, utan att kasta. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return text.slice(0, maxLength);
  return text.slice(0, maxLength - 1) + "…";
}

/** Normaliserar för förankringsjämförelse: gemener, ihopslagen whitespace. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Är `sourceText` spårbart till användarens egen text? Ett citat räknas som
 * förankrat om det (efter whitespace-/skiftlägesnormalisering) förekommer som
 * en sammanhängande delsträng av originaltexten. Parafraser och påhitt faller.
 */
export function isGrounded(sourceText: string, originalText: string): boolean {
  const needle = normalize(sourceText);
  if (needle.length === 0) return false;
  return normalize(originalText).includes(needle);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Trimmar, tar bort tomma, deduplicerar (skiftlägesokänsligt) och behåller ordning. */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const trimmed = asString(item);
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/**
 * Samlar de källor en post FAKTISKT vilar på: bara ordagrant förankrade citat.
 * Läser både `sources` (array) och `sourceText` (enkel sträng, bakåtkompatibelt)
 * så att motorvariationer tolereras. Dubbletter tas bort; oförankrade citat
 * släpps. Grundningen utvärderas på det FULLSTÄNDIGA citatet; kapning av antal
 * och längd sker i anroparen, efter grundningen, så att förankringssemantiken
 * är oförändrad. Tom lista ⇒ posten får inte visas.
 */
function collectGroundedSources(
  raw: Record<string, unknown>,
  originalText: string,
): string[] {
  // Kapa antalet kandidater INNAN den (potentiellt dyra) grundningen.
  const rawSources = Array.isArray(raw.sources)
    ? raw.sources.slice(0, PARSE_LIMITS.maxSourceCandidates)
    : [];
  const candidates: string[] = [
    ...asStringArray(rawSources),
    ...(asString(raw.sourceText).length > 0 ? [asString(raw.sourceText)] : []),
  ];

  const seen = new Set<string>();
  const grounded: string[] = [];
  for (const candidate of candidates) {
    if (!isGrounded(candidate, originalText)) continue;
    const key = normalize(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    grounded.push(candidate);
  }
  return grounded;
}

/** Kapar antal källor och trunkerar varje för visning (efter grundningen). */
function boundSources(grounded: string[]): string[] {
  return grounded
    .slice(0, PARSE_LIMITS.maxSourcesPerItem)
    .map((source) => truncate(source, PARSE_LIMITS.maxSourceLength));
}

function parseDecisions(value: unknown, originalText: string): Decision[] {
  if (!Array.isArray(value)) return [];
  const decisions: Decision[] = [];
  for (const raw of value.slice(0, PARSE_LIMITS.maxScanItems)) {
    if (decisions.length >= PARSE_LIMITS.maxDecisions) break; // överskott trunkeras
    if (!isRecord(raw)) continue;

    const action = asString(raw.action);
    if (action.length === 0) continue;

    const sources = boundSources(collectGroundedSources(raw, originalText));
    if (sources.length === 0) continue; // ingen spårbar källa → visas inte

    const context = asString(raw.context);
    const outcome = asString(raw.outcome);
    const capabilities = asStringArray(raw.capabilities)
      .slice(0, PARSE_LIMITS.maxCapabilitiesPerDecision)
      .map((cap) => truncate(cap, PARSE_LIMITS.maxCapabilityLength));

    decisions.push({
      action: truncate(action, PARSE_LIMITS.maxFieldLength),
      ...(context.length > 0
        ? { context: truncate(context, PARSE_LIMITS.maxFieldLength) }
        : {}),
      ...(outcome.length > 0
        ? { outcome: truncate(outcome, PARSE_LIMITS.maxFieldLength) }
        : {}),
      capabilities,
      sources,
      // En Decision vilar på användarens egna ord. Aldrig verified i v1.
      kind: "quote",
    });
  }
  return decisions;
}

function parseStrengths(value: unknown, originalText: string): GroundedClaim[] {
  if (!Array.isArray(value)) return [];
  const claims: GroundedClaim[] = [];
  for (const raw of value.slice(0, PARSE_LIMITS.maxScanItems)) {
    if (claims.length >= PARSE_LIMITS.maxStrengths) break;
    if (!isRecord(raw)) continue;

    const statement = asString(raw.statement);
    if (statement.length === 0) continue;

    const sources = boundSources(collectGroundedSources(raw, originalText));
    if (sources.length === 0) continue;

    // Styrkor är AI-tolkningar, aldrig konstateranden.
    claims.push({
      statement: truncate(statement, PARSE_LIMITS.maxFieldLength),
      sources,
      kind: "interpretation",
    });
  }
  return claims;
}

function parseRoles(value: unknown, originalText: string): RoleSuggestion[] {
  if (!Array.isArray(value)) return [];
  const roles: RoleSuggestion[] = [];
  for (const raw of value.slice(0, PARSE_LIMITS.maxScanItems)) {
    if (roles.length >= PARSE_LIMITS.maxRoles) break;
    if (!isRecord(raw)) continue;

    const role = asString(raw.role);
    if (role.length === 0) continue;

    const sources = boundSources(collectGroundedSources(raw, originalText));
    if (sources.length === 0) continue;

    // Roller är möjliga riktningar, aldrig konstateranden.
    roles.push({
      role: truncate(role, PARSE_LIMITS.maxFieldLength),
      rationale: truncate(asString(raw.rationale), PARSE_LIMITS.maxFieldLength),
      sources,
      kind: "interpretation",
    });
  }
  return roles;
}

export function parseReflection(
  raw: RawReflection,
  originalText: string,
): Reflection {
  const root = isRecord(raw) ? raw : {};
  const followUp = truncate(
    asString(root.followUpQuestion),
    PARSE_LIMITS.maxFollowUpLength,
  );
  return {
    decisions: parseDecisions(root.decisions, originalText),
    strengths: parseStrengths(root.strengths, originalText),
    roles: parseRoles(root.roles, originalText),
    followUpQuestion: followUp.length > 0 ? followUp : DEFAULT_FOLLOW_UP,
  };
}
