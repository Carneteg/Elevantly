import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * GDPR — radera ditt konto (CLAUDE.md 9.2). Anropar `delete_my_account()`
 * (security definer, migration 0008) som raderar den inloggade användarens
 * `auth.users`-rad; `on delete cascade` tar bort resten (profil, kopplingar,
 * inlägg, meddelanden, rapporter, blockeringar). Ingen service-role-nyckel
 * inblandad (CLAUDE.md 14) — funktionen raderar bara anroparens egen rad.
 *
 * Efter radering loggar vi ut (rensar sessionskakorna). Detta är irreversibelt
 * och sker på ett uttryckligt anrop från användaren (CLAUDE.md 8.2).
 */
export const runtime = "nodejs";

interface ErrorResponse {
  error: string;
}
interface OkResponse {
  ok: true;
}

export async function POST(): Promise<
  NextResponse<OkResponse | ErrorResponse>
> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Radering är inte tillgänglig just nu." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Du måste vara inloggad." },
      { status: 401 },
    );
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return NextResponse.json(
      { error: "Kontot kunde inte raderas. Försök igen." },
      { status: 502 },
    );
  }

  // Rensa sessionen — kontot finns inte längre.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
