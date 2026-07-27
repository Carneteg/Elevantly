import { NextResponse } from "next/server";
import { isReportStatus, SupabaseReportRepository } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Granskaråtgärd: sätt status på en rapport (åtgärdad/avvisad/öppna igen).
 * Session-bunden klient → RLS: bara en granskare (`is_admin()`) får uppdatera
 * rapporter (migration 0011). Vi verifierar admin här också för ett ärligt
 * felmeddelande, men RLS är den egentliga spärren (CLAUDE.md 9).
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
    return jsonError("Granskning är inte tillgänglig just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;
  const id = readString(body.id);
  const status = readString(body.status);
  if (!id || !isReportStatus(status)) {
    return jsonError("Ogiltig åtgärd.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return jsonError("Behörighet saknas.", 403);

  try {
    const reports = new SupabaseReportRepository(supabase);
    await reports.setStatus(id, status, user.id, new Date().toISOString());
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
