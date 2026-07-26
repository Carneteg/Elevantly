# Deploya Spegeln (Vercel)

Spegeln är en Next.js-app i en npm-workspace-monorepo (`apps/web` +
`packages/core`). Hosten måste köra **Next-servern**, eftersom server-routen
`/api/reflect` är det som håller AI-nyckeln server-side och anropar modellen.

> GitHub Pages fungerar **inte** — det kan bara serva statiska filer och kan
> inte köra server-routen eller hålla nyckeln hemlig. Vercel (eller annan
> Node-host) krävs.

## Förutsättningar

- Repot på GitHub (klart).
- En AI-nyckel i beredskap:
  - `OPENAI_API_KEY` — kräver att OpenAI-motorn är mergad (PR som inför
    `GptEngine`/`createEngine`), **eller**
  - `ANTHROPIC_API_KEY`.
- Ett Vercel-konto (gratis Hobby räcker).

## Engångsuppsättning

1. Logga in på [vercel.com](https://vercel.com) med ditt GitHub-konto.
2. **Add New… → Project** och importera `Carneteg/Elevantly`.
3. **Root Directory: `apps/web`** (klicka *Edit* och välj `apps/web`). Detta är
   det avgörande steget för monorepon — Vercel installerar från workspace-roten
   och bygger appen därifrån. `transpilePackages` gör att `@elevantly/core`
   byggs från källan, inget separat byggsteg behövs.
4. **Framework Preset: Next.js** (autodetekteras). Lämna Build-, Output- och
   Install-kommandon som standard.
5. **Environment Variables** (lägg till för Production *och* Preview):
   - `OPENAI_API_KEY` = din nyckel (eller `ANTHROPIC_API_KEY`).
   - Valfritt: `OPENAI_MODEL` (standard `gpt-4o`), `ANTHROPIC_MODEL`,
     `AI_PROVIDER` (`openai` eller `claude`).
   - Dessa läses **bara server-side** och exponeras aldrig för klienten.
6. **Deploy**. Efter en minut har du en URL.

## Efter uppsättning

- Varje merge till `main` auto-deployar; PR:er får preview-deploys.
- **Verifiera:** öppna URL:en, skriv några rader om vad du gjort, och kontrollera
  att svaret kommer tillbaka och är förankrat ("Du skrev: …").

## Viktigt att veta

- **Rate limiter är per-instans.** In-memory-varianten (`InMemoryRateLimiter`)
  delar inte tillstånd mellan Vercels serverless-instanser, så per-IP-gränsen
  blir inte tillförlitlig i drift — den duger för demo men skyddar inte i skala.
  Byt till en delad store (t.ex. Upstash Redis) bakom `RateLimiter`-interfacet
  inför riktig drift; route-logiken behöver inte röras.
- **Funktionstimeout.** En modelltur kan ibland ta några sekunder. Hobby-planens
  serverless-funktioner har en kort standardtimeout (~10 s). Ser du timeouts:
  lägg `export const maxDuration = 30;` överst i
  `apps/web/app/api/reflect/route.ts` (Vercel läser route-segmentets config).
- **Ingen databas behövs** för v1 — Spegeln sparar inget mellan besök.
- **Hemligheter** sätts bara i Vercels Environment Variables, aldrig i koden
  eller repot. `.env*.local` är gitignorerad.

## Annan host (alternativ)

Vilken host som kör en Node-server duger (Fly.io, Cloud Run, egen VPS):

```bash
npm install
npm run build
npm start --workspace apps/web   # kör next start; sätt PORT vid behov
```

Sätt samma miljövariabler som ovan. Behöver du en container säger du till, så
lägger jag en Dockerfile (Next.js standalone).
