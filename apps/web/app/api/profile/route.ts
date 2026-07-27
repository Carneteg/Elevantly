import { NextResponse } from "next/server";
import { isValidHandle, normalizeHandle, SupabaseProfileRepository } from "@elevantly/core";
import type { ProfileVisibility, StoredProfile } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Sparar den inloggade användarens profiltext och synlighet: handle, visningsnamn,
 * headline och privat/offentlig. Row-level security ser till att bara den egna
 * profilen rörs — men vi kräver även inloggning här och skriver aldrig åt någon
 * annans `userId` (CLAUDE.md 9). Besluten rörs inte av den här routen.
 */
export const runtime = "nodejs";

/** Hårda gränser på profiltext — dataminimering och skydd mot missbruk. */
const MAX_DISPLAY_NAME = 80;
const MAX_HEADLINE = 160;

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
  handle: string | null;
  visibility: ProfileVisibility;
}

export async function POST(
  request: Request,
): Promise<NextResponse<OkResponse | ErrorResponse>> {
  if (!isSupabaseConfigured()) {
    return jsonError("Konton är inte tillgängliga just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }

  const body = payload as Record<string, unknown>;

  // Synlighet krävs och måste vara ett giltigt värde.
  const visibility = body.visibility;
  if (
    visibility !== "private" &&
    visibility !== "contacts" &&
    visibility !== "public"
  ) {
    return jsonError("Ogiltig synlighet.", 400);
  }

  const handleRaw = readString(body.handle);
  const displayName = readString(body.displayName).slice(0, MAX_DISPLAY_NAME);
  const headline = readString(body.headline).slice(0, MAX_HEADLINE);

  // Handle: valfritt tills satt, men om det finns måste det vara giltigt.
  const handle = handleRaw ? normalizeHandle(handleRaw) : "";
  if (handle && !isValidHandle(handle)) {
    return jsonError(
      "Användarnamnet måste vara 3–30 tecken: a–z, 0–9, _ eller -.",
      400,
    );
  }

  // En delad profil (kontakter eller offentlig) måste vara nåbar via /u/handle —
  // den kräver ett användarnamn. Privat kräver inget.
  if (visibility !== "private" && !handle) {
    return jsonError(
      "Välj ett användarnamn innan du delar profilen.",
      400,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError("Du måste vara inloggad.", 401);
  }

  const repository = new SupabaseProfileRepository(supabase);

  let existing: StoredProfile | null;
  try {
    existing = await repository.load(user.id);
  } catch {
    return jsonError("Kunde inte läsa profilen. Försök igen.", 502);
  }

  const now = new Date().toISOString();
  const base: StoredProfile = existing ?? {
    userId: user.id,
    decisions: [],
    visibility: "private",
    discoverableByRecruiters: false,
    createdAt: now,
    updatedAt: now,
  };

  // Opt-in för rekryterarsök. Invarianten upprätthålls här, server-sidan:
  // upptäckbar kan bara vara sann på en OFFENTLIG profil (CLAUDE.md 9.3) —
  // oavsett vad klienten skickar.
  const wantsDiscoverable = body.discoverableByRecruiters === true;
  const discoverableByRecruiters = visibility === "public" && wantsDiscoverable;

  const updated: StoredProfile = {
    ...base,
    visibility,
    discoverableByRecruiters,
    ...(handle ? { handle } : { handle: undefined }),
    ...(displayName ? { displayName } : { displayName: undefined }),
    ...(headline ? { headline } : { headline: undefined }),
    updatedAt: now,
  };

  try {
    await repository.save(updated);
  } catch (error) {
    if (isHandleConflict(error)) {
      return jsonError("Användarnamnet är upptaget. Välj ett annat.", 409);
    }
    return jsonError("Kunde inte spara profilen. Försök igen.", 502);
  }

  return NextResponse.json({
    ok: true,
    handle: handle || null,
    visibility,
  });
}

/** Trimmad sträng, eller "" om värdet inte är en sträng. */
function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Kollar om felet är en krock på det unika handle-indexet (upptaget namn). */
function isHandleConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("duplicate key") ||
    message.includes("profiles_handle_unique") ||
    message.includes("unique constraint")
  );
}

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
