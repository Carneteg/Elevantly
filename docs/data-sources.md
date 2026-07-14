# Datakällor för insikter

> Status: strategi/beslut, ej implementerat. Kompletterar CLAUDE.md
> (dataprinciperna). Ändringar kräver beslut av produktägaren.

Detta dokument beskriver var Elevantlys konkreta insikter (lön, rolltrender,
karriärvägar) ska komma ifrån, och principerna för hur de får visas.

## Grundprincip: spårbar källa per siffra

Varje siffra vi visar för användaren ska bära **källa** och **färskhet**.
Hellre "Marknadslön enligt SCB 2024, för din rolltyp" än en naken siffra som
ser exakt ut men inte går att lita på.

En konkret siffra som är fel är värre än ingen siffra alls. Trovärdighet är
det vi konkurrerar på — det får aldrig offras för att en yta ska se komplett ut.

Regel: en insikt utan spårbar källa visas inte som fakta.

## Tre typer av insikter och deras källor

### 1. Lönedata
- **Öppen (börja här):** SCB lönestrukturstatistik per yrke (SSYK), sektor,
  region. Gratis, citeringsbar. Aggregerad och släpar i tid — duger för
  "marknadslön för din rolltyp", inte för realtid.
- **Uppgradering:** kommersiella lönedatakällor för mer aktuell,
  rollspecifik data. Kostar; villkor och pris måste verifieras mot
  leverantör innan beroende byggs.

### 2. Jobbmarknad & rolltrender ("efterfrågan ökade X%")
- **Öppen (börja här):** Arbetsförmedlingens JobTech Dev — öppna API:er över
  svenska jobbannonser med historik. Gör det möjligt att beräkna trender
  över tid på riktigt, gratis och spårbart. Främst Sverige.
- **Uppgradering:** kommersiell aggregator eller flera nationella källor för
  nordisk täckning.

### 3. Kompetens- & karriärvägar (hur roller och skills hänger ihop)
- **Öppen (börja här):** ESCO (EU:s klassificering av yrken/kompetenser) och
  svenska SSYK. Gratis skelettstruktur för kompetensgrafen — bygg inte från
  noll. Innehåller struktur, inte trender eller faktiska rörelser.
- **Växer fram:** faktiska karriärrörelser och trender ur Elevantlys egen
  användardata när tillräckligt många lagt in sina beslut (efter skala).

## Rekommenderad ordning

1. **Spegeln byggs först** — skapar den strukturerade profilen (bränslet).
2. **Konkreta marknadsinsikter är uttalad tvåa** — börja med de öppna
   källorna ovan, med spårbar källa per siffra.
3. Kommersiella källor och egen graf-data läggs på när det finns underlag
   och behov.

## Öppna frågor att verifiera

- Aktuella priser, API-gränser och licensvillkor för kommersiella källor
  (ej verifierade i detta dokument).
- Nordisk täckning bortom Sverige för jobbmarknadstrender.
- Uppdateringsfrekvens och hur "färskhet" ska visas i UI.
