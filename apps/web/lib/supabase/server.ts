import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase-klient för serverkomponenter, route-handlers och API-routes. Läser
 * och skriver sessionskakor via Next `cookies()`, så att row-level security
 * gäller för den inloggade användaren. Ingen nyckel lämnar servern som mer än
 * den publika anon-nyckeln (RLS är spärren).
 */
export async function createClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Anropat från en serverkomponent där kakor inte kan sättas.
          // Middleware uppdaterar sessionen, så detta kan ignoreras.
        }
      },
    },
  });
}
