/**
 * @elevantly/core — ramverksagnostisk domän, AI-lager och produktlogik för
 * Spegeln. Ingen React, ingen Next, inga UI-antaganden. Webben (och en
 * framtida app) importerar härifrån utan omskrivning.
 */

// Datamodell
export type {
  CapabilityClaim,
  ClaimKind,
  Confidence,
  Decision,
  ResponsibilityLevel,
} from "./decision";
export type {
  GroundedClaim,
  Reflection,
  RoleSuggestion,
} from "./reflection";

// AI-lager (motoragnostiskt)
export type {
  AIEngine,
  RawReflection,
  ReflectionInput,
} from "./ai/engine";
export { buildReflectionPrompt } from "./ai/prompt";
export type { ReflectionPrompt } from "./ai/prompt";
export {
  ClaudeEngine,
  DEFAULT_CLAUDE_MODEL,
  EngineError,
} from "./ai/claudeEngine";
export type { ClaudeEngineOptions } from "./ai/claudeEngine";

// Produktlogik
export { parseReflection, isGrounded, PARSE_LIMITS } from "./reflection/parse";
export { runReflection } from "./reflection/runReflection";

// Robusthet: rate limiting (utbytbart lager, som AIEngine)
export {
  InMemoryRateLimiter,
} from "./ratelimit/rateLimiter";
export type {
  RateLimiter,
  RateLimitResult,
  InMemoryRateLimiterOptions,
} from "./ratelimit/rateLimiter";

// Persistens: användarprofiler (utbytbart lager — in-memory + Supabase)
export { InMemoryProfileRepository } from "./persistence/inMemoryProfileRepository";
export { SupabaseProfileRepository } from "./persistence/supabaseProfileRepository";
export type {
  ProfileRepository,
  StoredProfile,
} from "./persistence/profile";
