import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Supabase-klient för klientkomponenter (körs i webbläsaren). Används av
 * inloggningssidan för att begära en magisk länk.
 */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
