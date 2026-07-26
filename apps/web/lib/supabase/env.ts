/**
 * Läser Supabase-miljövariablerna. Båda är publika (skyddade av row-level
 * security) och därför `NEXT_PUBLIC_`. Saknas de kastar vi ett tydligt fel i
 * stället för att skicka `undefined` vidare till klienten.
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase är inte konfigurerat: sätt NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url, anonKey };
}

/** Är Supabase konfigurerat? Används för att avgöra om inloggning är tillgänglig. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
