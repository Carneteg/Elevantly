import { NextResponse } from "next/server";
import { isReportSubjectType, SupabaseReportRepository } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Ta emot en rapport (flaggning) av en profil, ett inlägg eller ett meddelande.
 * Session-bunden klient → RLS: man skapar bara i eget namn, och ingen vanlig
 * användare kan läsa rapporter. En envägssignal in till granskning (CLAUDE.md 11).
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
    return jsonError("Rapportering är inte tillgänglig just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;

  const subjectType = readString(body.subjectType);
  const subjectId = readString(body.subjectId);
  const reason = readString(body.reason);

  if (!isReportSubjectType(subjectType) || !subjectId) {
    return jsonError("Ogiltig rapport.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad för att rapportera.", 401);

  const reports = new SupabaseReportRepository(supabase);
  try {
    await reports.create(
      user.id,
      subjectType,
      subjectId,
      reason,
      new Date().toISOString(),
    );
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Rapporten kunde inte tas emot. Försök igen.", 502);
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
