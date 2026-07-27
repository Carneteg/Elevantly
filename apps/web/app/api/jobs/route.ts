import { NextResponse } from "next/server";
import {
  isValidJobInput,
  StaticSkillTaxonomy,
  SupabaseCompanyRepository,
  SupabaseJobRepository,
} from "@elevantly/core";
import type { JobInput, JobStatus } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Arbetsgivar-åtgärder: posta ett jobb och ändra dess status. Session-bunden klient
 * → RLS: bara ett företags medlemmar postar/ändrar dess jobb (CLAUDE.md 9). Kraven
 * MÅSTE vara kanoniska begrepp ur taxonomin — vi validerar dem här så inga fritext-
 * "skills" smyger in och bryter anti-djungeln.
 */
export const runtime = "nodejs";

const STATUSES: JobStatus[] = ["draft", "published", "closed"];
const RESPONSIBILITIES = [
  "participated",
  "contributed",
  "led",
  "owned",
  "unknown",
];

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
    return jsonError("Jobb är inte tillgängligt just nu.", 503);
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

  const companyId = readString(body.companyId);
  if (!companyId) return jsonError("Företag saknas.", 400);

  const jobs = new SupabaseJobRepository(supabase);

  try {
    // Statusbyte.
    if (body.action === "setStatus") {
      const id = readString(body.id);
      const status = readString(body.status);
      if (!id || !isJobStatus(status)) return jsonError("Ogiltig åtgärd.", 400);
      await jobs.setStatus(id, companyId, status);
      return NextResponse.json({ ok: true });
    }

    // Skapa ett jobb. Bekräfta medlemskap (RLS är spärren, men detta ger ett
    // vänligt fel och företagsnamnet att denormalisera).
    const companies = new SupabaseCompanyRepository(supabase);
    const company = await companies.load(companyId);
    if (!company) return jsonError("Du är inte medlem i det här företaget.", 403);

    const requiredSkillIds = readStringArray(body.requiredSkillIds);
    const preferredSkillIds = readStringArray(body.preferredSkillIds);
    const responsibility = readString(body.responsibility) || "unknown";
    if (!RESPONSIBILITIES.includes(responsibility)) {
      return jsonError("Ogiltig ansvarsnivå.", 400);
    }

    // Alla valda krav måste vara kanoniska begrepp ur taxonomin.
    const validIds = new Set(
      (await new StaticSkillTaxonomy().list()).map((s) => s.id),
    );
    const allIds = [...requiredSkillIds, ...preferredSkillIds];
    if (allIds.some((id) => !validIds.has(id))) {
      return jsonError("Okänd kompetens vald.", 400);
    }

    const input: JobInput = {
      title: readString(body.title),
      summary: readString(body.summary),
      requiredSkillIds,
      preferredSkillIds,
      responsibility: responsibility as JobInput["responsibility"],
      ...(readString(body.location) ? { location: readString(body.location) } : {}),
      ...(typeof body.remote === "boolean" ? { remote: body.remote } : {}),
      status: body.publish === true ? "published" : "draft",
    };
    if (!isValidJobInput(input)) {
      return jsonError("Ange en titel och minst ett obligatoriskt krav.", 400);
    }

    await jobs.create(companyId, company.name, input, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Åtgärden kunde inte genomföras. Försök igen.", 502);
  }
}

function isJobStatus(value: string): value is JobStatus {
  return (STATUSES as string[]).includes(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
