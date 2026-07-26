import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Loggar ut användaren och skickar tillbaka till startsidan.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
