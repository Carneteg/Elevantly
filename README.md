# Elevantly

**En AI-first professionell identitetsplattform.** Elevantly hjälper
människor att förstå sitt professionella värde, utvecklas i sin karriär och
skapa rätt möjligheter — genom högkvalitativ, strukturerad data istället för
innehåll och följare.

Vi bygger inte ett bättre LinkedIn. Vi bygger den professionella plattform
man hade byggt 2026 om LinkedIn aldrig funnits.

## Vad vi tror på

- **AI är motorn, inte produkten.** Produkten styr AI — aldrig tvärtom.
- **Beslut och utfall framför titlar.** Vi bygger på vad människor faktiskt
  har gjort ("minskade churn 12%"), inte på påståenden om roller.
- **Värde varje vecka.** Du ska få professionellt värde ur din egen data
  även om ingen kontaktar dig.
- **Vi samlar aldrig data för datans skull.** Varje datapunkt måste besvara
  en konkret användarfråga.
- **Steve Jobs-standard.** Enkelhet, smak och genialitet är krav — inte
  ambitioner. Kräver något en manual är det fel designat.

## Vad vi INTE bygger

Ett socialt nätverk. Inget flöde, inga likes, inga följare. Inga funktioner
vars värde kräver att någon annan agerar.

## Tech stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** GPT och Claude som utbytbara motorer, embeddings + RAG

## Grundlag

Projektets principer, datamodell och arbetssätt beskrivs i
[`CLAUDE.md`](./CLAUDE.md) — Elevantlys konstitution. Den gäller för alla
som arbetar i projektet, människa som AI, och vinner vid konflikt.

## Spegeln v1 — första produkten

Spegeln är Elevantlys tunnaste produkt. Den besvarar en enda användarfråga:
**"Vad säger det jag faktiskt gjort om vad jag är bra på — och vilka roller
det pekar mot?"** Du skriver fritt om vad du gjort i jobbet; AI:n strukturerar
det till beslutsposter och speglar tillbaka en tolkning — där varje påstående
är förankrat i din egen text ("Grundat på: …"). Inget sparas mellan besök.

Kravspecen finns i [`docs/spegeln-v1-spec.md`](./docs/spegeln-v1-spec.md).

### Struktur (monorepo)

```
packages/core   Ramverksagnostisk domän, AI-lager och produktlogik.
                Ingen React, ingen Next. Återanvänds av en framtida app.
apps/web        Next.js-webbklient (Spegeln v1). Tunt UI ovanpå core.
```

AI-lagret är abstraherat bakom ett `AIEngine`-interface. Claude är motor #1;
en GPT-motor kan implementeras mot samma interface utan att röra
produktlogiken. Struktureringen (fritext → förankrade beslutsposter) lever i
`packages/core` och är testad.

### Robusthet

`/api/reflect` har en enkel per-IP rate limit (10 förfrågningar/minut →
`429` med `Retry-After`) och hårda input-/parser-gränser (max 8 000 tecken in;
antal och längder på AI-svarets poster kapas i stället för att krascha).
Rate-limitern är abstraherad bakom ett `RateLimiter`-interface, precis som
`AIEngine`. **In-memory-implementationen är per-instans och inte
distributionssäker** — den duger för demo/enkel drift; byt till en delad store
(Redis e.d.) bakom samma interface inför skalning, utan att röra route-logiken.

### Kör lokalt

```bash
npm install
cp .env.example apps/web/.env.local   # fyll i ANTHROPIC_API_KEY
npm run dev                            # startar webben på http://localhost:3000
```

Nyckeln läses bara server-side i `/api/reflect` och lämnar aldrig servern.

### Testa och bygga

```bash
npm test         # kör tester i alla paket (strukturering, rate limit, route-gränser)
npm run typecheck
npm run build
```

Dessa tester använder en fejkad AI-motor och kräver ingen nyckel.

### End-to-end-verifiering mot skarp modell

Bekräftar att hela `runReflection`-flödet fungerar mot en **riktig** Claude-modell
och att ärlighetsinvarianterna håller på skarpa svar: varje visad post är
förankrad i ett ordagrant citat, ingen post är `kind: "verified"`, och
ansvarsnivån överstiger aldrig vad texten stödjer (tvetydig text ger `unknown`,
inte `owned`/`led`). Bryts en invariant avslutas skriptet med felkod.

```bash
export ANTHROPIC_API_KEY=sk-...   # läses bara från miljön, lagras aldrig i repot
npm run verify:e2e
```

- **Kostar riktiga API-anrop.** Kör den medvetet, inte i en snäv loop.
- Modell: `claude-sonnet-5` som standard, override via `ANTHROPIC_MODEL`. Skriptet
  skriver ut vilken modell som faktiskt anropas.
- **Körs inte i CI** (CI har ingen nyckel och ska inte kosta) — det är en manuell,
  lokal rutin.

## Status

Spegeln v1 under utveckling. Vi bygger den tunnaste möjliga produkten som
skapar verkligt användarvärde innan vi bygger vidare.
