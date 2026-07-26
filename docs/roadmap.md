# Elevantly — Roadmap

> Status: levande planeringsdokument. Beskriver vad som är byggt och den
> **föreslagna** ordningen framåt. Prioritering och nya punkter beslutas av
> produktägaren (CLAUDE.md). Varje punkt måste bära en **namngiven
> användarfråga** (CLAUDE.md 6.1 / 7.1) — vi bygger inget utan en, och inget
> som bryter mot "Detta bygger vi ALDRIG" (CLAUDE.md 11).

## Princip för ordningen

Vi bygger den tunnaste möjliga produkten som skapar verkligt värde först och
lägger på lager först när de tjänar en användarfråga. Ordningen följer CLAUDE.md,
`docs/spegeln-v1-spec.md` (vad som byggs senare) och `docs/data-sources.md`
(konkreta insikter är uttalad tvåa).

---

## ✅ Byggt — Spegeln v1, den strukturerade kärnan

**Användarfråga:** *"Vad säger det jag faktiskt gjort om vad jag är bra på — och
vilka roller det pekar mot?"*

- En enda skärm: fritext → förankrade `Decision`-poster + tolkning + en
  uppföljningsfråga. Inget sparas mellan besök.
- **Ärlig förankring:** `ClaimKind` (`quote`/`interpretation`/`verified`),
  "Du skrev: …" för citat vs "Tolkat från: …" för tolkningar, roller som
  *möjliga riktningar* — aldrig konstateranden. Inget visas som fakta utan
  spårbar källa i användarens egen text.
- **Typade capabilities** (`name`/`confidence`/`sources`) och **ansvarsnivå**
  (`participated`…`owned`/`unknown`) som aldrig sätts högre än texten stödjer.
- **Motoragnostiskt AI-lager:** `ClaudeEngine` + `GptEngine` bakom `AIEngine`,
  motorval via miljön. *(OpenAI-motorn i granskning.)*
- **Robusthet:** per-IP rate limit, hårda parser-/input-gränser.
- **CI** (test/typecheck/build) + manuell **e2e-verifiering** mot skarp modell.

---

## 🔜 Härnäst — gå live

**Användarvärde:** appen blir nåbar för riktiga användare.

- Deploya webb-appen (Vercel eller annan Node-host), AI-nyckeln som server-side
  secret. *(Deploy-guide klar: `docs/deploy.md`, i granskning.)*
- Skarp e2e-verifiering med riktig nyckel.

---

## 🗺️ Nästa lager (föreslagen ordning — produktägaren beslutar)

### 1. Konkreta marknadsinsikter *(uttalad tvåa, `docs/data-sources.md`)*
**Användarfråga:** *"Vad är min rolltyp värd och vad efterfrågas — med en källa
jag kan lita på?"*
- Börja med **öppna källor** och **spårbar källa + färskhet per siffra**: SCB
  lönestatistik (SSYK), Arbetsförmedlingens JobTech för rolltrender, ESCO/SSYK
  för kompetens-/rollstruktur.
- Regel: en siffra utan spårbar källa visas aldrig som fakta.

### 2. Konton & persistens (Supabase)
**Användarfråga:** *"Får jag tillbaka min profil och kan bygga vidare på den
mellan besök?"*
- Auth + lagring av `Decision`-data i Supabase (Postgres). Datamodellen är redan
  ren och ägarskaps-neutral, så detta läggs på **utan omskrivning**.
- Användaren äger, kan exportera och radera sin data (GDPR).
- Förutsättning för flera punkter nedan.

### 3. Produktionshärdning för skala
**Användarvärde:** tjänsten håller när fler använder den.
- Delad rate-limit-store (t.ex. Redis) bakom `RateLimiter`-interfacet.
- Observability, felhantering och kostnadskontroll för AI-anrop.

---

## 🌅 Längre fram (kräver skala/underlag — strikt inom konstitutionen)

- **Kompetens-/karriärgraf** ovanpå ESCO/SSYK, senare berikad med faktiska
  karriärrörelser ur Elevantlys egen data (efter skala).
- **Nätverk/relationer** — endast om det håller sig strikt inom "Detta bygger vi
  ALDRIG": inget flöde, inga likes/följare, inget vars värde kräver att någon
  annan agerar.
- **Jobbmatchning** mot riktiga roller.
- **Kommersiella datakällor** (mer aktuell lön m.m.) när underlag och behov finns.
- **Separat app (t.ex. mobil)** som återanvänder samma `packages/core` —
  arkitekturen är redan uppdelad så logik, datamodell och AI-lager kan delas utan
  omskrivning.

---

## Vad vi aldrig bygger

Se CLAUDE.md avsnitt 11. Roadmapen får aldrig införa ett flöde, likes, följare,
fritextberoende "intelligens" eller funktioner vars värde kräver att någon annan
agerar.
