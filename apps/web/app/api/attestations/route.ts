import { NextResponse } from "next/server";
import {
  isValidMotivation,
  SupabaseAttestationRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Attesterings-åtgärder: begära (en kontakt intygar ett beslut), avgöra
 * (profilägaren godkänner/avböjer) och dra tillbaka (attesteraren tar bort sin
 * egen). Allt går genom en session-bunden Supabase-klient så att row-level
 * security och security-definer-funktionerna avgör vad som får ske — vi kan aldrig
 * agera i någon annans namn (CLAUDE.md 9). Motparten identifieras via handle
 * (begäran) eller attesterings-id; userId löses upp på servern och lämnar aldrig
 * klienten.
 */
export const runtime = "nodejs";

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
}

/** POST: begär en attestering av ett beslut hos innehavaren av `handle`. */
export async function POST(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Nätverk är inte tillgängligt just nu.", 503);
  }

  const body = await readJson(request);
  if (!body) return jsonError("Ogiltig förfrågan.", 400);

  const handle = readString(body.handle);
  const decisionKey = readString(body.decisionKey);
  const motivation = readString(body.motivation);
  if (!handle || !decisionKey) {
    return jsonError("Handle och beslut krävs.", 400);
  }
  if (!isValidMotivation(motivation)) {
    return jsonError(
      "Skriv en kort mening om hur du vet det här (minst 15 tecken).",
      400,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const profiles = new SupabaseProfileRepository(supabase);
  const attestations = new SupabaseAttestationRepository(supabase);

  // Ägaren måste vara synlig för attesteraren (en kontakt) — annars ingen läcka.
  const subjectUserId = await profiles.findUserIdByVisibleHandle(handle);
  if (!subjectUserId) return jsonError("Profilen hittades inte.", 404);
  if (subjectUserId === user.id) {
    return jsonError("Du kan inte attestera dina egna beslut.", 400);
  }

  try {
    await attestations.request(
      { subjectUserId, decisionKey, motivation },
      user.id,
      new Date().toISOString(),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(messageOf(error, "Kunde inte skicka attesteringen."), 400);
  }
}

/** PATCH: profilägaren avgör en väntande attestering om sig själv. */
export async function PATCH(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Nätverk är inte tillgängligt just nu.", 503);
  }

  const body = await readJson(request);
  if (!body) return jsonError("Ogiltig förfrågan.", 400);

  const id = readString(body.id);
  const status = readString(body.status);
  if (!id || (status !== "accepted" && status !== "declined")) {
    return jsonError("Ogiltig åtgärd.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const attestations = new SupabaseAttestationRepository(supabase);
  try {
    await attestations.decide(id, user.id, status, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(messageOf(error, "Kunde inte uppdatera attesteringen."), 400);
  }
}

/** DELETE: attesteraren drar tillbaka sin egen attestering. */
export async function DELETE(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Nätverk är inte tillgängligt just nu.", 503);
  }

  const body = await readJson(request);
  if (!body) return jsonError("Ogiltig förfrågan.", 400);

  const id = readString(body.id);
  if (!id) return jsonError("Attestering saknas.", 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const attestations = new SupabaseAttestationRepository(supabase);
  try {
    await attestations.withdraw(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(messageOf(error, "Kunde inte dra tillbaka attesteringen."), 400);
  }
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
