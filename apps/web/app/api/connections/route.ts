import { NextResponse } from "next/server";
import {
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Kontakt-åtgärder: skicka förfrågan (via handle), acceptera, avböj och ta bort.
 * Allt går genom en session-bunden Supabase-klient så att row-level security
 * gäller — vi kan aldrig agera i någon annans namn (CLAUDE.md 9). Förfrågan
 * identifierar mottagaren via handle; adressatens userId löses upp på servern
 * och lämnar aldrig klienten.
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
    return jsonError("Nätverk är inte tillgängligt just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;
  const action = body.action;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const connections = new SupabaseConnectionRepository(supabase);
  const profiles = new SupabaseProfileRepository(supabase);
  const now = new Date().toISOString();

  try {
    if (action === "request") {
      const handle = readString(body.handle);
      if (!handle) return jsonError("Handle saknas.", 400);

      const addresseeId = await profiles.findUserIdByPublicHandle(handle);
      if (!addresseeId) {
        return jsonError("Profilen hittades inte eller är inte offentlig.", 404);
      }
      if (addresseeId === user.id) {
        return jsonError("Du kan inte ansluta till dig själv.", 400);
      }
      const existing = await connections.findBetween(user.id, addresseeId);
      if (existing) {
        return jsonError("Ni har redan en koppling eller en väntande förfrågan.", 409);
      }
      await connections.request(user.id, addresseeId, now);
      return NextResponse.json({ ok: true });
    }

    // accept/decline/remove refererar motparten via userId (från den
    // autentiserade nätverkssidan). RLS avgör vad som faktiskt får ske.
    const otherUserId = readString(body.userId);
    if (!otherUserId) return jsonError("Motpart saknas.", 400);

    if (action === "accept") {
      // Motparten är avsändaren; jag är mottagaren.
      await connections.accept(otherUserId, user.id, now);
      return NextResponse.json({ ok: true });
    }
    if (action === "decline" || action === "remove") {
      await connections.remove(user.id, otherUserId);
      return NextResponse.json({ ok: true });
    }

    return jsonError("Okänd åtgärd.", 400);
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
