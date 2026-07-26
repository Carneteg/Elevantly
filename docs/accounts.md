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

- **`InMemoryProfileRepository`** finns nu (per-instans, för lokal utveckling och
  tester). Testad.
- **`SupabaseProfileRepository`** läggs till senare bakom samma interface —
  produktlogiken behöver inte röras.

### Supabase-mappning (planerad, ej byggd)

- Tabell `profiles` (eller `decisions`) med kolumnen `user_id` som pekar på
  `auth.users`.
- **Row-level security (RLS):** en användare kan bara läsa/skriva sina egna
  rader. Detta är den avgörande säkerhetsspärren och sätts när Supabase kopplas
  in.
- Auth via **Supabase Auth**; servern läser `userId` ur den autentiserade
  sessionen. Vi bygger aldrig egen kryptografi/lösenordshantering.

## Öppna beslut (innan auth/UX-lagret byggs)

Dessa stäms av med produktägaren — de styr nästa steg, inte grunden ovan:

1. **Inloggningsmetod:** Supabase Auth magisk länk (e-post) vs OAuth (Google)
   vs båda.
2. **Vad som sparas:** bara `Decision`-poster (minimalt, rekommenderat) eller
   även användarens råa inmatningar/historik.
3. **Återvändande-flöde:** ackumulera beslut över besök och spegla över hela
   mängden (rekommenderat), eller per-session.
4. **Scaffolda Supabase nu** (SQL-migration + RLS + `SupabaseProfileRepository`,
   redo att koppla nyckel till) eller vänta.

## Vad detta inte är

Ingen social funktion. Konton tjänar användarens egen profil och värde — inte
flöde, följare eller delning (CLAUDE.md 11).
