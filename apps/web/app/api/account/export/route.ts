import { NextResponse } from "next/server";
import {
  SupabaseBlockRepository,
  SupabaseConnectionRepository,
  SupabaseMessageRepository,
  SupabasePostRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * GDPR — exportera din data (CLAUDE.md 9.2). Samlar ALLT som rör den inloggade
 * användaren och skickar tillbaka det som en nedladdningsbar JSON-fil. Läser via
 * en session-bunden klient, så row-level security gäller: du får bara ut din egen
 * data (och de meddelanden/kopplingar du själv ingår i).
 *
 * Vi tar inte med rapporter (reports): de är envägs-moderationssignaler som
 * användaren enligt RLS (0006) inte kan läsa, och de rör i praktiken någon annan.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Export är inte tillgänglig just nu." },
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

  try {
    const profiles = new SupabaseProfileRepository(supabase);
    const connections = new SupabaseConnectionRepository(supabase);
    const posts = new SupabasePostRepository(supabase);
    const messages = new SupabaseMessageRepository(supabase);
    const blocks = new SupabaseBlockRepository(supabase);

    const profile = await profiles.load(user.id);
    const [allConnections, myPosts, myMessages, myBlocks] = await Promise.all([
      connections.listAllForUser(user.id),
      posts.listByAuthors([user.id]),
      messages.listAllForUser(user.id),
      blocks.listBlocked(user.id),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      account: { userId: user.id, email: user.email ?? null },
      profile,
      decisions: profile?.decisions ?? [],
      connections: allConnections,
      posts: myPosts,
      messages: myMessages,
      blocks: myBlocks,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="elevantly-min-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Kunde inte skapa exporten. Försök igen." },
      { status: 502 },
    );
  }
}
