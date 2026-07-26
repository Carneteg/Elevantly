import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landningspunkt för den magiska länken. Byter engångskoden mot en session
 * och skickar användaren vidare till profilen. Vid fel: tillbaka till login.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
