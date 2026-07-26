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
- Nästa steg här: `contacts`-synlighet (endast kontakter) när kontakter finns.

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

### 5. Möjligheter
**Användarfråga:** *"Vilka roller/samarbeten passar det jag faktiskt gjort?"*
- Matcha profil mot roller/samarbeten — bygger på den grundade datan och
  (senare) marknadsinsikter.

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
  meddelanden/förfrågningar (upprätthålls i rutterna). `BlockButton` på `/u/handle`.
- Nästa: en **granskningsvy** för rapporter/blockeringar (admin), och att lyfta
  blockering till DB-nivå (RLS på inlägg/meddelanden) som djupare försvar.

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
