import { NextResponse } from "next/server";
import {
  isValidCompanyName,
  SupabaseCompanyRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Skapa ett företag (självbetjänat). Session-bunden klient → skapandet går genom
 * `create_company` (security definer) som gör skaparen till ägare/medlem atomiskt.
 * Ingen kan skapa i någon annans namn (CLAUDE.md 9).
 */
export const runtime = "nodejs";

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
  id: string;
}

export async function POST(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Företag är inte tillgängligt just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;
  const name = readString(body.name);
  const summary = readString(body.summary);
  if (!isValidCompanyName(name)) {
    return jsonError("Ange ett företagsnamn (1–100 tecken).", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  try {
    const companies = new SupabaseCompanyRepository(supabase);
    const company = await companies.create(
      user.id,
      name,
      new Date().toISOString(),
      summary || undefined,
    );
    return NextResponse.json({ ok: true, id: company.id });
  } catch {
    return jsonError("Företaget kunde inte skapas. Försök igen.", 502);
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
