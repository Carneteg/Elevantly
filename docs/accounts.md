# Konton & persistens — design

> Status: **under uppbyggnad.** Grunden (persistens-abstraktionen) är byggd i
> `packages/core`; auth- och UX-lagret väntar på beslut (se "Öppna beslut").
> Kompletterar CLAUDE.md (data- & GDPR-principerna) och `docs/roadmap.md`.
> Supabase kopplas på senare — inget här kräver att den är igång.

## Användarfråga

*"Får jag tillbaka min profil och kan bygga vidare på den mellan besök?"*

Utan konton är Spegeln tillståndslös (v1). Med konton kan användaren komma
tillbaka, se sina sparade beslut och lägga till fler över tid.

## Vad som lagras (dataminimering)

Bara den **strukturerade kärnan** — `Decision`-poster — knutet till en `userId`.
Vi lagrar medvetet **inte** AI:ns tolkningar (styrkor/roller): de härleds färskt
ur besluten vid varje spegling, så de aldrig blir inaktuella eller känns mer
verifierade än de är (CLAUDE.md 7.2–7.3, 8.3).

Användaren **äger** sin data: kan se den, exportera den (läs profilen) och
radera den (`delete`) — GDPR by design (CLAUDE.md 9).

## Arkitektur (byggt)

Persistens ligger bakom ett rent interface, precis som `AIEngine` och
`RateLimiter`:

```ts
interface ProfileRepository {
  load(userId): Promise<StoredProfile | null>;
  save(profile: StoredProfile): Promise<void>;
  delete(userId): Promise<void>;   // rätt till radering
}

interface StoredProfile {
  userId: string;
  decisions: Decision[];
  createdAt: string;   // ISO 8601
  updatedAt: string;
}
```

- **`InMemoryProfileRepository`** — per-instans, för lokal utveckling och tester.
  Testad.
- **`SupabaseProfileRepository`** — byggd, bakom samma interface. Tar in en
  Supabase-klient (injiceras) och gör CRUD mot `profiles`. Testad mot en fejkad
  klient. Produktlogiken ser ingen skillnad mot in-memory-varianten.

### Supabase-schema (byggt: `supabase/migrations/0001_profiles.sql`)

- Tabell `public.profiles`: `user_id` (PK → `auth.users`, `on delete cascade`),
  `decisions` (jsonb), `created_at`, `updated_at`.
- **Row-level security:** fyra policies så att en användare ENDAST kan
  läsa/skapa/uppdatera/radera sin egen rad (`auth.uid() = user_id`). Detta är den
  avgörande spärren.
- Kör migrationen i Supabase (SQL editor eller `supabase db push`) när projektet
  är kopplat.

### Auth + profil (byggt)

Inloggning via **Supabase Auth, magisk länk** (`@supabase/ssr`), i webb-lagret:

- `lib/supabase/{client,server}.ts` + `middleware.ts` (roterar sessionen).
- `/login` (magisk länk) → `/auth/callback` (byter kod mot session) → `/profile`.
- `/profile` är skyddad (kräver inloggning) och visar den ackumulerade profilen
  via `SupabaseProfileRepository`, som får en session-bunden klient → RLS gäller.
- `/api/reflect` sparar (bästa förmåga) nya beslut till den inloggades profil
  och ackumulerar dem (`upsertProfile`). Utloggade användare speglar som förut,
  inget sparas.
- Miljö: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publika,
  skyddade av RLS). Saknas de är inloggning avstängd men appen fungerar.

**Supabase-konfiguration som krävs** (utöver migrationen):
- Authentication → **URL Configuration**: sätt **Site URL** till produktions-URL:en
  och lägg previews/prod-URL:er under **Redirect URLs** (annars avvisas den
  magiska länkens `/auth/callback`-redirect).
- Email-providern (magisk länk) påslagen.

## Beslutat (produktägaren)

1. **Inloggning:** Supabase Auth, magisk länk via e-post.
2. **Vad som sparas:** bara `Decision`-poster (dataminimering).
3. **Återbesök:** ackumulera beslut över besök och spegla över hela den samlade
   mängden.
4. **Supabase:** scaffoldat nu (migration + RLS + `SupabaseProfileRepository`),
   redo att koppla nyckel till.

## Kvar att bygga (nästa steg)

- **Spegla över hela den ackumulerade mängden:** idag ackumuleras besluten på
  profilen, men speglingen resonerar fortfarande per inmatning. Nästa steg är att
  låta AI-lagret spegla över en uppsättning `Decision`-poster (utöka `AIEngine`)
  — stäms av innan bygge.
- **Export- och raderingsyta** för användaren (GDPR) — `delete()` finns i
  repositoryt, ytan återstår.
- Det sociala lagret ovanpå profilen (synlig profil → kontakter → flöde), se
  `docs/roadmap.md`.

## Vad detta inte är

Ingen social funktion. Konton tjänar användarens egen profil och värde — inte
flöde, följare eller delning (CLAUDE.md 11).
