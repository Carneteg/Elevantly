import { NextResponse } from "next/server";
import {
  ClaudeEngine,
  EngineError,
  InMemoryRateLimiter,
  runReflection,
} from "@elevantly/core";
import type { RateLimiter, Reflection } from "@elevantly/core";

/**
 * Server-route för Spegeln. Här — och bara här — läses API-nyckeln ur miljön;
 * den lämnar aldrig servern (CLAUDE.md 14). Ingenting sparas: användarens text
 * lever bara under förfrågan och loggas inte (dataminimering, GDPR).
 */
export const runtime = "nodejs";

/**
 * Hård övre gräns på användartexten. Avvisas här, innan den skickas till
 * AI-motorn, så att ett anrop inte kan svälla obegränsat.
 */
const MAX_INPUT_LENGTH = 8000;

/**
 * Per-IP rate limit. Delas som en modulnivå-singleton så att den lever mellan
 * förfrågningar inom instansen.
 *
 * OBS: in-memory-varianten är per-instans och inte distributionssäker (se
 * @elevantly/core). Duger för demo/enkel drift; byt till en delad store (Redis
 * e.d.) bakom `RateLimiter` inför skalning — route-logiken behöver inte röras.
 */
const rateLimiter: RateLimiter = new InMemoryRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

interface ReflectResponse {
  reflection: Reflection;
}
interface ErrorResponse {
  error: string;
}

export async function POST(
  request: Request,
): Promise<NextResponse<ReflectResponse | ErrorResponse>> {
  // 1. Rate limit först — billigt, och skyddar allt nedanför.
  const rate = await rateLimiter.check(getClientIp(request));
  if (!rate.allowed) {
    return jsonError(
      "För många förfrågningar, försök igen om en stund.",
      429,
      { "Retry-After": String(rate.retryAfterSeconds) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }

  const text =
    typeof (payload as { text?: unknown })?.text === "string"
      ? (payload as { text: string }).text.trim()
      : "";

  if (text.length === 0) {
    return jsonError("Skriv några rader om vad du gjort först.", 400);
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return jsonError("Texten är lite för lång — korta ner den.", 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError("AI-motorn är inte konfigurerad.", 503);
  }

  const engine = new ClaudeEngine({
    apiKey,
    model: process.env.ANTHROPIC_MODEL || undefined,
  });

  try {
    const reflection = await runReflection(engine, text);
    return NextResponse.json({ reflection });
  } catch (error) {
    if (error instanceof EngineError) {
      return jsonError(
        "AI-motorn kunde inte tolka texten just nu. Försök igen.",
        502,
      );
    }
    throw error;
  }
}

/**
 * Bästa gissning av klientens IP från proxy-headers. Bakom en betrodd proxy
 * är `x-forwarded-for` den vanliga källan; annars faller vi tillbaka till en
 * gemensam hink ("unknown"). För demo/enkel drift räcker det; en produktions-
 * uppsättning bör konfigurera vilken proxy som får sätta headern.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status, headers });
}
