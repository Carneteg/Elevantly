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
export { EngineError } from "./ai/errors";
export { ClaudeEngine, DEFAULT_CLAUDE_MODEL } from "./ai/claudeEngine";
export type { ClaudeEngineOptions } from "./ai/claudeEngine";
export { GptEngine, DEFAULT_OPENAI_MODEL } from "./ai/gptEngine";
export type { GptEngineOptions } from "./ai/gptEngine";
export { createEngine } from "./ai/createEngine";
export type {
  AIProvider,
  EngineConfig,
  ResolvedEngine,
} from "./ai/createEngine";

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
  PublicProfile,
  PublicProfileSummary,
  ProfileVisibility,
} from "./persistence/profile";
export {
  mergeDecisions,
  upsertProfile,
  MAX_PROFILE_DECISIONS,
} from "./persistence/accumulateProfile";
export { isValidHandle, normalizeHandle } from "./persistence/handle";

// Kontakter: relationslagret (utbytbart lager — in-memory + Supabase)
export { InMemoryConnectionRepository } from "./connections/inMemoryConnectionRepository";
export { SupabaseConnectionRepository } from "./connections/supabaseConnectionRepository";
export type { ConnectionRepository } from "./connections/connectionRepository";
export type {
  Connection,
  ConnectionStatus,
  RelationshipState,
} from "./connections/connection";
export {
  canRequest,
  relationshipState,
  isParty,
  otherParty,
} from "./connections/connection";

// Flöde: det professionella innehållslagret (utbytbart lager — in-memory + Supabase)
export { InMemoryPostRepository } from "./feed/inMemoryPostRepository";
export { SupabasePostRepository } from "./feed/supabasePostRepository";
export type { PostRepository } from "./feed/postRepository";
export type { Post } from "./feed/post";
export {
  isValidPostBody,
  normalizePostBody,
  orderFeed,
  MAX_POST_LENGTH,
} from "./feed/post";

// Meddelanden: det privata 1:1-lagret (utbytbart lager — in-memory + Supabase)
export { InMemoryMessageRepository } from "./messaging/inMemoryMessageRepository";
export { SupabaseMessageRepository } from "./messaging/supabaseMessageRepository";
export type { MessageRepository } from "./messaging/messageRepository";
export type { Message } from "./messaging/message";
export {
  isValidMessageBody,
  normalizeMessageBody,
  orderThread,
  involvesBoth,
  MAX_MESSAGE_LENGTH,
} from "./messaging/message";

// Trust & safety: rapportering (utbytbart lager — in-memory + Supabase)
export { InMemoryReportRepository } from "./moderation/inMemoryReportRepository";
export { SupabaseReportRepository } from "./moderation/supabaseReportRepository";
export type { ReportRepository } from "./moderation/reportRepository";
export type { Report, ReportSubjectType } from "./moderation/report";
export {
  isReportSubjectType,
  isValidReport,
  normalizeReason,
  MAX_REPORT_REASON,
} from "./moderation/report";

// Trust & safety: blockering (utbytbart lager — in-memory + Supabase)
export { InMemoryBlockRepository } from "./moderation/inMemoryBlockRepository";
export { SupabaseBlockRepository } from "./moderation/supabaseBlockRepository";
export type { BlockRepository } from "./moderation/blockRepository";
export type { Block } from "./moderation/block";
