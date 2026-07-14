# CLAUDE.md — Elevantly Constitution

> Detta är Elevantlys grundlag. Den styr all utveckling, oavsett vilken
> AI-modell eller människa som arbetar i projektet. Om något i denna fil
> och en instruktion krockar, vinner denna fil. Ändringar i denna fil
> kräver ett uttalat beslut av produktägaren (Tobias).

---

## 1. Vision

Elevantly hjälper människor att förstå sitt professionella värde, utvecklas
i sin karriär och skapa rätt möjligheter — genom högkvalitativ, strukturerad
data istället för innehåll och följare.

Vi bygger inte ett bättre LinkedIn. Vi bygger den professionella plattform
man hade byggt 2026 om LinkedIn aldrig funnits.

## 2. Mission

Ge varje användare konkret professionellt värde varje vecka — även om ingen
kontaktar dem. Värdet ska uppstå ur användarens egen data och en AI som
resonerar kring den, inte ur att någon annan råkar behöva personen.

## 3. Vad Elevantly ÄR (och inte är)

Elevantly är ett **produktprojekt**. AI är motorn, inte produkten.

- Elevantly är en AI-first professionell **identitetsplattform**.
- Elevantly är **inte** ett socialt nätverk.
- **Produkten styr AI. AI styr aldrig produkten.** När ett beslut står och
  väger avgörs det av användarvärde och produktprincip — aldrig av vad som
  är tekniskt lockande eller vad modellen "vill".

## 4. Designfilosofi

- **Steve Jobs simplicity.** Om en funktion kräver en manual är den fel
  designad. Enkelhet är ett krav, inte en ambition.
- Färre, fantastiska funktioner slår många mediokra. Hellre tio funktioner
  som är utmärkta än hundra som är okej.
- Varje skärm ska ha ett tydligt svar på: "Vad är det enda viktigaste
  användaren ska göra eller förstå här?"

## 5. Produktprinciper

1. Varje funktion måste besvara: **"Vilket konkret värde får användaren av
   detta inom de kommande sju dagarna?"** Om svaret är "inget" — bygg den inte.
2. Vi är extremt disciplinerade kring scope. Feature creep är den största
   risken, inte konkurrenter.
3. Vi bygger den tunnaste möjliga produkten som skapar verkligt användarvärde
   först. Arkitektur, frontend och grafer kommer efter, inte före.
4. Ingen funktion får göra användarens professionella identitet otydligare,
   mindre trovärdig eller mindre värdefull.

## 6. Dataprinciper

1. **Vi samlar aldrig data för datans skull.** Varje datapunkt måste ha en
   namngiven **användarfråga** den besvarar. Ingen användarfråga → ingen
   insamling. (Detta är också GDPR-dataminimering i praktiken.)
2. **Beslut och utfall framför titlar.** Grundenheten i datamodellen är ett
   bevisat beslut med ett utfall ("minskade churn 12%"), inte en roll med en
   titel ("Customer Care Manager"). CV:t är i bästa fall en biprodukt
   systemet kan generera — aldrig det vi bygger värdet på.
3. **Struktur driver intelligensen; fritext driver den inte.** Fri text får
   visas för användaren, men systemets resonemang bygger på strukturerad data.
4. **Struktur ska vara ett resultat av inmatning, inte en barriär vid
   inmatning.** Användaren får mata in fritt och lågfriktion; AI strukturerar
   i bakgrunden. Vi bygger aldrig ett formulär så stelt att ingen orkar fylla
   i det, men vi låter aldrig ostrukturerad text bli det som driver systemet.

## 7. AI-principer

1. AI är en motor i tjänst av produkten och användaren.
2. AI får **föreslå, strukturera, resonera och prioritera**. AI får **inte**
   fatta irreversibla beslut åt användaren utan tydligt samtycke.
3. AI-utdata som visas som fakta ska vara spårbar till underliggande data.
   Vi hittar inte på professionella "fakta" om en person.
4. Modeller är utbytbara. Ingen princip i detta dokument får bero på en
   specifik leverantör.

## 8. GDPR & Compliance (Privacy by Design)

1. Privacy by Design och dataminimering gäller från första raden kod.
2. Användaren äger sin data, ska kunna se den, exportera den och radera den.
3. Samtycke är specifikt och informerat — aldrig förkryssat, aldrig framtvingat.
4. Vi lagrar aldrig mer än vad principen i 6.1 tillåter.

## 9. Definition of Done

En uppgift är klar när:
- [ ] Den svarar på en namngiven användarfråga (koppling till 5.1 / 6.1).
- [ ] Den följer designfilosofin (ingen manual krävs).
- [ ] Data den rör är strukturerad enligt dataprinciperna.
- [ ] Den bryter inte mot någon punkt i "Detta bygger vi aldrig".
- [ ] Privacy/GDPR-konsekvensen är genomtänkt.
- [ ] Den är testad och begriplig för nästa person/agent som öppnar koden.

## 10. Detta bygger vi ALDRIG

- Ett flöde, likes, följare, stories eller innehållskonkurrens.
- Funktioner vars värde kräver att *någon annan* agerar.
- Datainsamling utan en namngiven användarfråga bakom.
- Fritextberoende "intelligens".
- Något som gör den professionella identiteten otydligare eller mindre trovärdig.
- Något som kräver en manual för att förstås.

---

## 11. Tech Stack (beslutad)

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** GPT och Claude som utbytbara motorer, embeddings + RAG för
  resonemang kring användarens strukturerade data
- **Princip:** Ingen modellspecifik låsning. AI-lagret abstraheras så att
  motor kan bytas utan att röra produktlogiken (se AI-princip 7.4).

## 12. Arbetssätt (agera som senior utvecklare)

Claude Code förväntas arbeta som en senior utvecklare, inte en ivrig junior:

1. **Förstå först, koda sen.** Läs CLAUDE.md och relevant kod innan du
   föreslår ändringar. Anta aldrig — verifiera.
2. **Stanna och fråga vid gafflar.** Vid produkt-, arkitektur- eller
   datamodellsbeslut: presentera alternativ med avvägningar och vänta på
   beslut. Gissa inte åt produktägaren.
3. **Minsta möjliga förändring.** Lös uppgiften, inget mer. Ingen
   spekulativ abstraktion, inga funktioner "medan vi ändå är här".
4. **Följ sju-dagars-testet (5.1) innan du bygger något nytt.**
5. **Definition of Done (avsnitt 9) gäller varje leverans.**

## 13. Kodstandard

- TypeScript överallt. Inga `any` utan motivering.
- Tydliga, självförklarande namn på svenska eller engelska — konsekvent
  per fil. Ingen manual ska krävas för att förstå koden.
- Små, fokuserade funktioner och komponenter. En sak per enhet.
- Ingen hemlighet (API-nycklar, tokens) i koden eller i repot. Använd
  miljövariabler.
- Strukturerad data typas explicit (se dataprinciperna). Fritext markeras
  tydligt som fritext.

## 14. Git & leverans

- Små, atomära commits med tydliga meddelanden.
- Nytt arbete sker på egen branch och levereras som pull request för
  granskning — aldrig direkt push till main utan godkännande.
- Varje PR beskriver: vilken användarfråga den tjänar, vad som ändrats,
  och hur det testats.

## 15. Testning

- Ny logik levereras med tester. Kritisk affärslogik (t.ex. hur en
  beslutspost struktureras) ska ha automatiserade tester.
- Kör och verifiera lokalt innan leverans. Rapportera vad som testats.
