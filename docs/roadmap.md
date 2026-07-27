# Elevantly — Roadmap

> Status: levande planeringsdokument. Beskriver vad som är byggt och den
> **föreslagna** ordningen framåt. Prioritering och nya punkter beslutas av
> produktägaren (CLAUDE.md). Varje punkt måste bära en **namngiven
> användarfråga** och följa grundlagen (inkl. "Detta bygger vi ALDRIG").
>
> **Riktning:** en professionell plattform med ett socialt lager — grundad
> profil + nätverk, flöde och möjligheter. Kärnan (grundad, strukturerad
> identitet) är särskiljaren; det sociala byggs ovanpå, ärligt.

## Princip för ordningen

Vi bygger den tunnaste möjliga produkten som skapar verkligt värde först och
lägger på lager när de tjänar en användarfråga. Identiteten kommer före det
sociala — man kan inte nätverka runt en tom profil, och även en ensam användare
ska få värde från dag ett (CLAUDE.md 6.2).

---

## ✅ Byggt — den grundade identitetskärnan

**Spegeln v1.** Användarfråga: *"Vad säger det jag faktiskt gjort om vad jag är
bra på — och vilka roller det pekar mot?"*

- Fritext → förankrade `Decision`-poster + tolkning, ärlig förankring
  ("Du skrev:" / "Tolkat från:"), typade capabilities + ansvarsnivå.
- Motoragnostiskt AI-lager (`ClaudeEngine` + `GptEngine`), robusthet (rate
  limit, parser-gränser), CI + e2e-verifiering.

## ✅ Byggt — konton & persistens (förutsättning för allt socialt)

**Användarfråga:** *"Får jag tillbaka min profil och kan bygga vidare på den
mellan besök?"* En sparad, ägd identitet är fundamentet man knyter nätverket
till.

- `ProfileRepository` + Supabase (migration `0001` + RLS), auth (magisk länk),
  inloggningsyta och ackumulera-flödet (`upsertProfile`).

---

## 🗺️ Det sociala lagret (ny riktning — föreslagen ordning)

### 1. Publik / synlig profil — 🔜 *pågår*
**Användarfråga:** *"Kan andra hitta och förstå mitt professionella värde?"*
- Din grundade profil blir visningsbar via en delbar länk (`/u/handle`), med
  **synlighetskontroll** — default privat, offentlig är ett uttryckligt opt-in
  (CLAUDE.md 9.3). Migration `0002` (visibility/handle/profiltext + RLS
  public-read), profil-editor och den publika profilsidan.
- Substans över fåfänga: profilen visar bevisade beslut/utfall (bara poster med
  spårbar källa), aldrig e-post eller `userId`, inga tomma titlar.
- Byggt: **`contacts`-synlighet** (endast accepterade kontakter). Tre steg —
  privat / kontakter / offentlig (CLAUDE.md 9.3). Migration `0012` (constraint +
  RLS-policy där en accepterad kontakt får läsa en `contacts`-profil).
  RLS-styrda läsvägar `loadVisibleProfileByHandle` / `findUserIdByVisibleHandle`
  gör att `/u/handle` visar innehållet för kontakter och att rapportera/blockera
  fungerar där. Offentlig upptäckt (nya kopplingar) förblir publik-bara.

### 2. Kontakter & relationer — 🔜 *pågår*
**Användarfråga:** *"Kan jag bygga och nå mitt professionella nätverk?"*
- Skicka/acceptera/avböj kontakt, se dina kontakter. Ömsesidigt samtycke — inga
  påtvingade följare, inga fåfänga-siffror som produktens själ (CLAUDE.md 6.5, 11).
- Byggt: `Connection`-modell + ren tillståndslogik (`relationshipState`),
  `ConnectionRepository` (in-memory + Supabase), migration `0003` (RLS: bara
  parterna ser en rad), "Anslut" på `/u/handle` och en `/network`-sida.
- **Avgränsning v1:** kopplingar sker via offentliga profiler (du ansluter från
  någons `/u/handle`). "Privat-men-anslutningsbar" är ett senare beslut.

### 3. Professionellt flöde — 🔜 *pågår*
**Användarfråga:** *"Vad händer i mitt nätverk som är värt min tid?"*
- Dela uppdateringar/insikter; se innehåll från dina accepterade kontakter.
- Byggt: `Post`-modell + ren, **förklarbar ordning** (`orderFeed`, kronologisk
  nyast först — CLAUDE.md 8.5), `PostRepository` (in-memory + Supabase), migration
  `0004` (RLS: syns för författaren + accepterade kontakter), `/feed` med
  lågfriktions-kompositor. Inga mörka mönster, ingen doomscroll-optimering (§11).
- Senare: koppla inlägg till en `Decision` för grundade inlägg; rikare relevans.

### 4. Meddelanden — 🔜 *pågår*
**Användarfråga:** *"Kan jag ta ett samtal med rätt person?"*
- Direkt 1:1-kommunikation mellan accepterade kontakter.
- Byggt: `Message`-modell + ren logik (`orderThread`, `involvesBoth`, validering),
  `MessageRepository` (in-memory + Supabase), migration `0005` (RLS: bara parterna
  ser; skicka bara till accepterad kontakt; tabellen i realtidspubliceringen).
  `/messages` (samtal = kontakter), `/messages/[handle]` (live tråd via Supabase
  Realtime + kompositor), "Meddela" på kontakter. Strikt privat (§9).

### 5. Möjligheter — 🔜 *pågår*
**Användarfråga:** *"Vilka roller/samarbeten passar det jag faktiskt gjort?"*
- Byggt (v1): grundad **rollmatchning**. `matchRoles` matchar användarens beslut/
  kompetenser mot rollarketyper — rent, deterministiskt och **förklarbart**
  (CLAUDE.md 8.5): varje förslag visar exakt vilka kompetenser och beslut det
  vilar på (8.3), och en roll föreslås aldrig utan spårbart stöd (11). Rollkällan
  är utbytbar (`RoleCatalog`, 8.4): v1 är en kurerad katalog i repot
  (`StaticRoleCatalog`), en extern taxonomi (ESCO/SSYK) kan ersätta den senare.
  `/opportunities` (server-renderad, ger värde utan nätverk — 6.2) + nav.
- Senare: rikare relevans (embeddings/RAG), samarbeten/möjligheter från nätverket,
  och marknadsinsikter (lön/rolltrender) med spårbar källa per siffra.

### Tvärgående: trust & safety — 🔜 *pågår*
Ett socialt lager kräver **moderering, rapportering och missbruksskydd** från
start — förtroende är produkten. Planeras in parallellt, inte som eftertanke.
- Byggt (första bricken): **rapportering**. `Report`-modell + validering,
  `ReportRepository` (in-memory + Supabase), migration `0006` (RLS: skapa i eget
  namn, ingen läsning för vanliga användare — granskning via service-role),
  `ReportButton` på profiler och inlägg. En envägssignal in till granskning.
- Byggt (andra bricken): **blockering**. `Block`-modell + `BlockRepository`
  (in-memory + Supabase), migration `0007` (RLS: se bara egna blockeringar +
  `security definer`-funktionen `is_blocked_with` som svarar ömsesidigt utan att
  avslöja att man blockerats). Blockering bryter befintlig koppling och nekar nya
  meddelanden/förfrågningar. `BlockButton` på `/u/handle`.
- Byggt (tredje bricken): **blockering i datalagret (defense in depth)**. Migration
  `0009` lyfter blockeringskontrollen från route-koden ner i RLS: `is_blocked_with`
  vävs in i policyerna för att skicka meddelande, skapa/acceptera kontakt och se
  flödesinlägg. Route-koden behåller sina kontroller för vänliga felmeddelanden —
  två lås, inte ett. Nu kan ingen app-väg glömma spärren.
- Byggt (fjärde bricken): **granskningskö för rapporter (admin)**. Migration `0010`
  inför en `admins`-tabell + `is_admin()` (security definer) och en RLS-policy så
  att bara granskare kan LÄSA rapporter (medlemskap hanteras out-of-band via SQL —
  ingen kan ge sig själv admin via API:t). `ReportRepository.listForReview` +
  en server-skyddad `/admin`-sida (404 för icke-granskare) som visar flaggat
  innehåll nyast först. Ingen automatik — en signal för mänskligt beslut.
- Byggt (femte bricken): **åtgärder i granskningskön**. Migration `0011` ger
  rapporter en `status` (`open`/`resolved`/`dismissed`) med spårning av vem/när
  (`resolved_by`/`resolved_at`), och en RLS-policy så bara granskare kan UPPDATERA.
  `ReportRepository.setStatus` + kön visar bara öppna. `/admin` fick knappar
  "Markera hanterad"/"Avvisa" (via `/api/admin/reports`) — ett spårat mänskligt
  beslut, ingen automatik.
- Nästa: ett beslut om huruvida blockeringar ska exponeras för granskare (idag
  privata by design), och eventuellt en historik-vy över åtgärdade rapporter.

### Tvärgående: data & integritet (GDPR) — ✅ *byggt (första bricken)*
**Användarfråga:** *"Kan jag se, ta med mig och radera min data?"* Med
persondata i flera lager (profil, kopplingar, flöde, meddelanden, blockeringar)
är dataägande inte en eftertanke (CLAUDE.md 9.2).
- **Exportera:** `listAllForUser` på kopplings- och meddelanderepot + en
  session-bunden `GET /api/account/export` som samlar profil, beslut, kopplingar,
  inlägg, meddelanden och blockeringar till en nedladdningsbar JSON-fil (RLS: bara
  din egen data).
- **Radera konto:** migration `0008` — en `security definer`-funktion
  `delete_my_account()` som raderar den inloggade användarens `auth.users`-rad;
  `on delete cascade` (0001–0007) tar bort resten. Ingen service-role-nyckel
  (CLAUDE.md 14). `POST /api/account/delete` + en "Din data"-sektion på
  profilsidan (exportknapp + radering med RADERA-bekräftelse).

---

## 🌅 Längre fram

- **Marknadsinsikter** (lön/rolltrender) från öppna källor med spårbar källa per
  siffra (SCB, JobTech, ESCO/SSYK) — se `docs/data-sources.md`.
- **Kompetens-/karriärgraf** (ESCO/SSYK), senare berikad med faktiska rörelser
  ur Elevantlys egen data.
- **AI-driven relevans** i nätverk och flöde (embeddings + RAG över strukturerad
  data).
- **Separat app (mobil)** som återanvänder `packages/core`.

## Produktionshärdning (löpande)

- Delad rate-limit-store (Redis e.d.) bakom `RateLimiter`.
- Realtime-infrastruktur för flöde/meddelanden (Supabase realtime).
- Observability, kostnadskontroll för AI-anrop, moderationsverktyg.

## Vad vi aldrig bygger

Se CLAUDE.md avsnitt 11. Det sociala lagret får aldrig införa mörka mönster,
fåfänga som själ, ohederliga (ogrundade) påståenden, eller något vars värde
kräver att användaren jämför sig till skada.
