import { NextResponse } from "next/server";
import {
  isValidPostBody,
  SupabasePostRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { PostGrounding } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Flödes-åtgärder: skapa ett inlägg och ta bort ett eget inlägg. Allt går genom
 * en session-bunden Supabase-klient så att row-level security gäller — man kan
 * bara skapa i eget namn och bara ta bort egna inlägg (CLAUDE.md 9).
 */
export const runtime = "nodejs";

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
}

export async function POST(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Flödet är inte tillgängligt just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const posts = new SupabasePostRepository(supabase);

  try {
    if (body.action === "delete") {
      const id = readString(body.id);
      if (!id) return jsonError("Inlägg saknas.", 400);
      await posts.delete(id, user.id);
      return NextResponse.json({ ok: true });
    }

    // Standard: skapa ett inlägg.
    const text = readString(body.body);
    if (!isValidPostBody(text)) {
      return jsonError("Skriv något först (och håll det under 3000 tecken).", 400);
    }

    // Valfri grund: ett av författarens EGNA beslut. Vi litar aldrig på klientens
    // text — vi laddar användarens beslut och bygger ögonblicksbilden från det
    // faktiska beslutet vid `decisionIndex` (CLAUDE.md 8.3).
    let grounding: PostGrounding | undefined;
    if (body.decisionIndex !== undefined && body.decisionIndex !== null) {
      const index = Number(body.decisionIndex);
      const profiles = new SupabaseProfileRepository(supabase);
      const profile = await profiles.load(user.id);
      const decision = profile?.decisions?.[index];
      if (!Number.isInteger(index) || !decision) {
        return jsonError("Ogiltigt beslut.", 400);
      }
      grounding = {
        action: decision.action,
        ...(decision.outcome ? { outcome: decision.outcome } : {}),
      };
    }

    await posts.create(user.id, text, new Date().toISOString(), grounding);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Åtgärden kunde inte genomföras. Försök igen.", 502);
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
