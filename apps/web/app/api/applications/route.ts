import { NextResponse } from "next/server";
import {
  isApplicationStatus,
  SupabaseApplicationRepository,
  SupabaseJobRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { ApplicationInput } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Ansöknings-åtgärder: söka ett jobb och (för arbetsgivaren) sätta status. Vid
 * ansökan bygger vi en SAMTYCKT ögonblicksbild av kandidatens grundade profil på
 * servern — klienten skickar aldrig in besluten (CLAUDE.md 8.3/9.3). Session-bunden
 * klient → RLS: man söker som sig själv på ett publicerat jobb; bara företagets
 * medlemmar sätter status.
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
    return jsonError("Ansökningar är inte tillgängliga just nu.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ogiltig förfrågan.", 400);
  }
  const body = payload as Record<string, unknown>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Du måste vara inloggad.", 401);

  const applications = new SupabaseApplicationRepository(supabase);

  try {
    // Arbetsgivarens statusbeslut.
    if (body.action === "setStatus") {
      const id = readString(body.id);
      const status = readString(body.status);
      if (!id || !isApplicationStatus(status)) {
        return jsonError("Ogiltig åtgärd.", 400);
      }
      await applications.setStatus(id, status);
      return NextResponse.json({ ok: true });
    }

    // Kandidatens ansökan.
    const jobId = readString(body.jobId);
    if (!jobId) return jsonError("Jobb saknas.", 400);

    const job = await new SupabaseJobRepository(supabase).load(jobId);
    if (!job || !job.companyId) return jsonError("Jobbet hittades inte.", 404);
    if (job.status !== "published") {
      return jsonError("Jobbet tar inte emot ansökningar.", 400);
    }

    // Bygg ögonblicksbilden ur kandidatens egen profil.
    const profile = await new SupabaseProfileRepository(supabase).load(user.id);
    const input: ApplicationInput = {
      jobTitle: job.title,
      companyName: job.company,
      ...(profile?.displayName ? { candidateName: profile.displayName } : {}),
      ...(profile?.headline ? { candidateHeadline: profile.headline } : {}),
      decisions: profile?.decisions ?? [],
      ...(readString(body.message) ? { message: readString(body.message) } : {}),
    };

    await applications.apply(
      jobId,
      job.companyId,
      user.id,
      input,
      new Date().toISOString(),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/redan sökt/i.test(message)) {
      return jsonError("Du har redan sökt det här jobbet.", 409);
    }
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
