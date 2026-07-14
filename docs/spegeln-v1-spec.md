# Spegeln — Kravspec v1

> Status: godkänd kravspec för första bygguppgiften. Kompletterar CLAUDE.md.
> Claude Code får bygga enligt denna spec. Beslut som inte täcks här ska
> stämmas av med produktägaren innan de fattas.

## Syfte

Spegeln är Elevantlys första och tunnaste produkt. Den bevisar kärntesen:
**beslut och utfall framför titlar skapar värde direkt.**

Användarfrågan den besvarar:
**"Vad säger det jag faktiskt gjort om vad jag är bra på — och vilka roller
det pekar mot?"**

## Användarloop (v1)

1. Användaren möts av en enda skärm med en fritextruta. Ingen inloggning,
   inga fält, inget formulär.
2. Användaren beskriver fritt några saker de faktiskt gjort i jobbet.
3. AI:n strukturerar fritexten till **beslutsposter** (handling, kontext,
   mätbart utfall om det finns, samt vilka kompetenser handlingen visar).
4. AI:n svarar på användarfrågan: en kort, skarp tolkning av vad detta säger
   om personen och vilka roller det pekar mot.
5. Varje påstående i svaret är **förankrat** i något användaren faktiskt
   skrev (visas som "Grundat på: ...").

## Datamodell (v1)

En `Decision` (beslutspost):
- `action` (string): vad personen gjorde. Obligatorisk.
- `context` (string, valfri): omständigheter, tidsram.
- `outcome` (string, valfri): mätbart utfall om det finns.
- `capabilities` (string[]): kompetenser handlingen visar.
- `sourceText` (string): exakt textutdrag ur användarens input som posten
  härleds från. Obligatorisk — driver förankringen.

Strukturerad data (fälten ovan) driver logiken. Användarens råa fritext får
sparas och visas, men driver aldrig systemets resonemang.

## Krav (måste)

- En enda skärm. Ingen manual ska behövas.
- AI:n får aldrig visa ett påstående som fakta utan spårbar källa i
  `sourceText` (CLAUDE.md AI-principer).
- Ingen data samlas som inte tjänar användarfrågan (CLAUDE.md dataprinciper).
- TypeScript. Next.js + React + Tailwind. AI-lagret abstraherat så motor
  (GPT/Claude) kan bytas.
- Ingen hemlighet i koden; nycklar via miljövariabler.
- Kritisk logik (strukturering av beslutsposter) har tester.

## Utanför scope (v1) — bygg INTE

- Inloggning, konton, profiler som sparas mellan besök.
- Nätverk, flöde, delning, andra användare.
- Marknads-/löne-/trenddata (se docs/data-sources.md — detta är tvåan).
- Matchning mot riktiga jobb.
- Knowledge graph.

## Definition of Done

Se CLAUDE.md avsnitt 10. Dessutom specifikt för Spegeln:
- [ ] En användare kan skriva fritext och få strukturerade beslut tillbaka.
- [ ] Svaret på användarfrågan är förankrat i användarens egen text.
- [ ] Inget påstående visas utan spårbar källa.
- [ ] Levererad som PR med beskrivning av användarfråga + ändring + test.

## Öppna frågor till produktägaren

- Vilken AI-motor används först i utvecklingen (GPT eller Claude)?
- Ska svaret kännas som början på en dialog (copilot-känsla) redan i v1,
  eller som ett engångsresultat?
