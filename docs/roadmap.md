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

## 🔜 Pågår — konton & persistens (förutsättning för allt socialt)

**Användarfråga:** *"Får jag tillbaka min profil och kan bygga vidare på den
mellan besök?"* En sparad, ägd identitet är fundamentet man knyter nätverket
till.

- `ProfileRepository` + Supabase-scaffolding (migration + RLS) — *i granskning.*
- Kvar: auth (magisk länk) + inloggningsyta + ackumulera-flödet.

---

## 🗺️ Det sociala lagret (ny riktning — föreslagen ordning)

### 1. Publik / synlig profil
**Användarfråga:** *"Kan andra hitta och förstå mitt professionella värde?"*
- Din grundade profil blir visningsbar, med **synlighetskontroll** (privat /
  endast kontakter / offentlig) — samtycke och kontroll enligt CLAUDE.md 9.
- Substans över fåfänga: profilen visar bevisade beslut/utfall, inte tomma
  titlar.

### 2. Kontakter & relationer
**Användarfråga:** *"Kan jag bygga och nå mitt professionella nätverk?"*
- Skicka/acceptera kontakt, se ömsesidiga kontakter. Riktiga relationer, inga
  fåfänga-följarsiffror som produktens själ (CLAUDE.md 6.5, 11).

### 3. Professionellt flöde
**Användarfråga:** *"Vad händer i mitt nätverk som är värt min tid?"*
- Dela uppdateringar/insikter; se relevant innehåll från nätverket.
- **Förklarbar rankning** som tjänar professionellt värde, inte enbart
  engagemang (CLAUDE.md 8.5). Inga mörka mönster (CLAUDE.md 11).

### 4. Meddelanden
**Användarfråga:** *"Kan jag ta ett samtal med rätt person?"*
- Direkt kommunikation mellan kontakter.

### 5. Möjligheter
**Användarfråga:** *"Vilka roller/samarbeten passar det jag faktiskt gjort?"*
- Matcha profil mot roller/samarbeten — bygger på den grundade datan och
  (senare) marknadsinsikter.

### Tvärgående: trust & safety
Ett socialt lager kräver **moderering, rapportering och missbruksskydd** från
start — förtroende är produkten. Planeras in parallellt, inte som eftertanke.

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
