import { NextResponse } from "next/server";
import {
  isValidMessageBody,
  SupabaseBlockRepository,
  SupabaseConnectionRepository,
  SupabaseMessageRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { Message } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Skicka ett meddelande till en kontakt (via handle). Session-bunden klient →
 * row-level security gäller: man kan bara skriva i eget namn och bara till en
 * accepterad kontakt (CLAUDE.md 9). Mottagarens userId löses upp på servern.
 */
export const runtime = "nodejs";

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
  message: Message;
}

export async function POST(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Meddelanden är inte tillgängliga just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;

  const handle = readString(body.handle);
  const text = readString(body.body);
  if (!handle) return jsonError("Mottagare saknas.", 400);
  if (!isValidMessageBody(text)) {
    return jsonError("Skriv något först (max 2000 tecken).", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const profiles = new SupabaseProfileRepository(supabase);
  const connections = new SupabaseConnectionRepository(supabase);
  const messages = new SupabaseMessageRepository(supabase);
  const blocks = new SupabaseBlockRepository(supabase);

  try {
    const recipientId = await profiles.findUserIdByPublicHandle(handle);
    if (!recipientId) {
      return jsonError("Mottagaren hittades inte.", 404);
    }
    if (await blocks.isBlockedBetween(user.id, recipientId)) {
      return jsonError("Det går inte att skicka meddelande till den här användaren.", 403);
    }
    const connection = await connections.findBetween(user.id, recipientId);
    if (!connection || connection.status !== "accepted") {
      return jsonError("Ni är inte kontakter.", 403);
    }
    const message = await messages.send(
      user.id,
      recipientId,
      text,
      new Date().toISOString(),
    );
    return NextResponse.json({ ok: true, message });
  } catch {
    return jsonError("Meddelandet kunde inte skickas. Försök igen.", 502);
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
