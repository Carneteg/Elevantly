import { NextResponse } from "next/server";
import {
  SupabaseBlockRepository,
  SupabaseConnectionRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Blockera / avblockera en användare (via handle). Att blockera bryter även en
 * eventuell befintlig koppling. Session-bunden klient → RLS: man hanterar bara
 * sina egna blockeringar (CLAUDE.md 9). Den blockerades userId löses upp på servern.
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
    return jsonError("Blockering är inte tillgänglig just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;
  const action = body.action;
  const handle = readString(body.handle);
  if (!handle) return jsonError("Handle saknas.", 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const profiles = new SupabaseProfileRepository(supabase);
  const blocks = new SupabaseBlockRepository(supabase);
  const connections = new SupabaseConnectionRepository(supabase);

  try {
    const otherId = await profiles.findUserIdByPublicHandle(handle);
    if (!otherId) return jsonError("Profilen hittades inte.", 404);
    if (otherId === user.id) {
      return jsonError("Du kan inte blockera dig själv.", 400);
    }

    if (action === "block") {
      await blocks.block(user.id, otherId, new Date().toISOString());
      // Att blockera bryter en eventuell koppling eller väntande förfrågan.
      await connections.remove(user.id, otherId);
      return NextResponse.json({ ok: true });
    }
    if (action === "unblock") {
      await blocks.unblock(user.id, otherId);
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
