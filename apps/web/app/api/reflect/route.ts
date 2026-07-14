import { NextResponse } from "next/server";
import { ClaudeEngine, EngineError, runReflection } from "@elevantly/core";
import type { Reflection } from "@elevantly/core";

/**
 * Server-route för Spegeln. Här — och bara här — läses API-nyckeln ur miljön;
 * den lämnar aldrig servern (CLAUDE.md 14). Ingenting sparas: användarens text
 * lever bara under förfrågan och loggas inte (dataminimering, GDPR).
 */
export const runtime = "nodejs";

/** Rimlig övre gräns så en förfrågan inte kan svälla obegränsat. */
const MAX_INPUT_LENGTH = 6000;

interface ReflectResponse {
  reflection: Reflection;
}
interface ErrorResponse {
  error: string;
}

export async function POST(
  request: Request,
): Promise<NextResponse<ReflectResponse | ErrorResponse>> {
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

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
