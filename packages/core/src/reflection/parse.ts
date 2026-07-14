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
 * Allt som saknar obligatoriska fält, eller vars sourceText inte återfinns i
 * användarens text, filtreras bort. Funktionen kastar aldrig — trasig eller
 * ofullständig input ger en tom (men giltig) Reflection.
 */

/** Standardfråga om motorn inte gav en egen (copilot-känsla ska aldrig saknas). */
const DEFAULT_FOLLOW_UP =
  "Vill du berätta om en situation där du löste något som var svårare än det såg ut?";

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

function parseDecisions(value: unknown, originalText: string): Decision[] {
  if (!Array.isArray(value)) return [];
  const decisions: Decision[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const action = asString(raw.action);
    const sourceText = asString(raw.sourceText);
    // Obligatoriska fält + spårbar källa. Annars visas posten inte.
    if (action.length === 0) continue;
    if (!isGrounded(sourceText, originalText)) continue;

    const context = asString(raw.context);
    const outcome = asString(raw.outcome);
    decisions.push({
      action,
      ...(context.length > 0 ? { context } : {}),
      ...(outcome.length > 0 ? { outcome } : {}),
      capabilities: asStringArray(raw.capabilities),
      sourceText,
    });
  }
  return decisions;
}

function parseStrengths(value: unknown, originalText: string): GroundedClaim[] {
  if (!Array.isArray(value)) return [];
  const claims: GroundedClaim[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const statement = asString(raw.statement);
    const sourceText = asString(raw.sourceText);
    if (statement.length === 0) continue;
    if (!isGrounded(sourceText, originalText)) continue;
    claims.push({ statement, sourceText });
  }
  return claims;
}

function parseRoles(value: unknown, originalText: string): RoleSuggestion[] {
  if (!Array.isArray(value)) return [];
  const roles: RoleSuggestion[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const role = asString(raw.role);
    const sourceText = asString(raw.sourceText);
    if (role.length === 0) continue;
    if (!isGrounded(sourceText, originalText)) continue;
    roles.push({ role, rationale: asString(raw.rationale), sourceText });
  }
  return roles;
}

export function parseReflection(
  raw: RawReflection,
  originalText: string,
): Reflection {
  const root = isRecord(raw) ? raw : {};
  const followUp = asString(root.followUpQuestion);
  return {
    decisions: parseDecisions(root.decisions, originalText),
    strengths: parseStrengths(root.strengths, originalText),
    roles: parseRoles(root.roles, originalText),
    followUpQuestion: followUp.length > 0 ? followUp : DEFAULT_FOLLOW_UP,
  };
}
