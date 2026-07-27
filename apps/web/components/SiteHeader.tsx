import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MainNav } from "./MainNav";

/**
 * Den globala toppnaven — ramen som återkommer på varje sida (ProConnect Fas 1).
 * Läser inloggningsstatus server-sidan (env-skyddat: utan Supabase renderas den
 * utloggade varianten, så CI-bygget klarar sig utan nycklar). Semantisk `<header>`
 * med landmärke; navigering och kontomeny ligger i `MainNav`.
 */
export async function SiteHeader() {
  const { signedIn, email } = await readAuth();
  const initial = (email?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--color-ink)]"
        >
          Elevantly
        </a>
        <MainNav signedIn={signedIn} email={email} initial={initial} />
      </div>
    </header>
  );
}

async function readAuth(): Promise<{ signedIn: boolean; email: string | null }> {
  if (!isSupabaseConfigured()) return { signedIn: false, email: null };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { signedIn: Boolean(user), email: user?.email ?? null };
  } catch {
    return { signedIn: false, email: null };
  }
}
