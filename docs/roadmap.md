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

## Produktstrategi (fördjupning — senior produktägare)

> Riktningsbeslut från produktägaren. Styr prioritering: bygg det som tjänar
> **kilen** (verifierad kompetens), avstå resten. Detta är strategin bakom
> ordningen ovan.

### 1. Var vi faktiskt konkurrerar — kilen, inte en frontalattack
LinkedIn är tre produkter i en: CV-arkiv, rekryteringsverktyg (där pengarna finns)
och innehållsflöde. Att slå alla tre samtidigt är självmord. Vår **kil** är
**verifierad kompetens i stället för självrapporterad** — den enda dimensionen där
LinkedIn är strukturellt svag och inte kan följa efter utan att kannibalisera sig
själv (deras flöde bygger på fritt skryt som driver engagemang och annonser). Om vi
äger *"bevisat, inte påstått"* äger vi något de inte kan kopiera. **Allt vi bygger
ska tjäna den positionen.**

**Nordstjärna, inte DAU.** Vi optimerar medvetet INTE för daglig aktivitet eller
scroll-tid. Mät i stället: *antal profiler med ≥3 verifierade prestationer* och
*antal rekryterare som gjort en kvalificerad kontakt utifrån ett bevis*. Mäter vi
oss som ett socialt nätverk fattar vi beslut som gör oss till en sämre LinkedIn.

### 2. Profilen — produktens hjärta (den saknade skärmen)
Den avgörande skärmen är hur en **besökare (rekryterare)** ser en profil. Struktur:
- **Identitetsrad:** namn, självvald inriktning (inte titel), och en lugn
  **förtroendeindikator** — inte en gamifierad poäng, utan t.ex. "8 av 10
  prestationer har kopplat utfall".
- **Ryggrad:** beslut & utfall, inte arbetsuppgifter. Varje post: *"Jag gjorde X →
  ledde till mätbart Y → så här kan det styrkas."* CV listar ansvar; vi listar konsekvenser.
- **Gradering av bevis** (verkligheten är gråskalig): *självrapporterat* (grått),
  *kontextförankrat* (länk till mätning/dokument/tidslinje), *attesterat* (tidigare
  kollega/chef intygar). Vi garanterar inte sanning — vi gör **graden av
  underbyggnad synlig och ärlig**. Detta bygger vidare på `ClaimKind` som redan
  finns (`quote`/`interpretation`/`verified` — `verified` är reserverad, ännu oanvänd).
- **Attestering är socialt känsligt.** LinkedIns "endorsements" dog för att de blev
  valutalösa. Gör attestering *dyr*: begränsat antal, kopplad till en faktisk relation
  i nätverket, med kort motivering (inte ett klick). Knappheten ger värdet.

### 3. Desktop är strategiskt, inte "nice to have"
Vår mest värdefulla användare — **rekryteraren som betalar** — jobbar på desktop,
granskar många profiler bredvid varandra och läser långt. Mobilen är där man
*underhåller* profilen; desktop är där den *konsumeras och konverterar*. Prioritera
en responsiv desktoplayout tidigt, med **profilen** och **kandidatsök/upptäckt** som
de första ytorna som får breddyta. Flödet förblir sekundärt.

### 4. Intäktsmodell — individen är aldrig produkten
- **Individen betalar aldrig för grundvärdet och är aldrig produkten.** Bygga profil,
  se vem som tittat, ta emot meddelanden, bli kontaktad — gratis, för alltid. I samma
  sekund vi gömmer "se vem som besökt din profil" bakom en betalvägg blir vi det vi kritiserar.
- **Intäkten kommer från efterfrågesidan:** arbetsgivare/rekryterare betalar för att
  söka, filtrera på verifierad kompetens och nå kandidater (samma motor som LinkedIns
  Talent Solutions, men renare etik — vi tar betalt av dem med kommersiellt syfte, inte
  av jobbsökaren i utsatt läge). Fin symmetri: vår kärnfunktion (verifiering) är exakt
  det rekryterare betalar mest för, för den sänker deras största kostnad (felrekryteringar).
- **Vakta:** sälj aldrig data eller annonser mot individen. En frivillig "supporter"-nivå
  får aldrig låsa upp funktioner — bara kosmetik/stöd, annars smyger tvåklasssamhället in.
- **Största risken är inte designen — det är kallstarten:** rekryterare betalar först när
  det finns tillräckligt med verifierade profiler; kandidater kommer när det finns seriösa
  rekryterare. Marknadsplatsens båda sidor måste byggas innan pengarna kommer.

### 5. Sekvensering (framåt)
Koncentrera krutet på **verifieringsloopen** först — allt annat är värdelöst utan den.
1. **Spegeln + profilen som en enhet** — från fritext-prestation till hur den
   strukturerade, bevisgraderade posten visas för en besökare. Testa kärnhypotesen mot
   riktiga användare: *litar en rekryterare mer på en Elevantly-profil än på ett CV, och
   är en kandidat villig att underbygga sina påståenden?* Nej där → resten spelar ingen roll.
2. **Nätverk + attestering** (gör bevisen trovärdiga, men socialt riskabelt — designa försiktigt).
3. **Flöde + chatt sist** — retention-funktioner, inte value-funktioner. Risk att bygga
   dem för tidigt och av gammal vana jaga engagemang → LinkedIn-klon.
   > Not: vi har redan byggt flöde/chatt/jobb i v1. Strategin omprioriterar *fokus och
   > vidareutveckling* framåt mot verifieringsloopen — inte rivning av det byggda.

### 6. Öppna frågor att svara på härnäst
1. **Vår första nisch?** "Alla yrkesverksamma" är ingen go-to-market. Argument för en tight
   grupp där bevisad kompetens redan är valuta och CV:n är uppblåsta — t.ex. produkt-/
   ingenjörsroller (dit exemplen redan lutar).
2. **Hur gör vi verifieringen icke-gameable** så den inte förfaller som LinkedIns endorsements?
3. **Vilken sida av marknadsplatsen tänder vi först**, och med vilken manuell insats
   (concierge / handkurerade profiler) tar vi oss förbi kallstarten?

---

## Fas 7 (nästa): verifieringsloop, profilvy & desktop — UX-spec

> Detaljerad UX-/produktspecifikation för den skärm strategin vilar på: hur en
> **besökare (rekryterare)** ser en profil. Byggd på befintligt designspråk (mörk
> bas, mintgrön accent, seriff-rubriker, monospace för metadata, mjukt upphöjda kort).
> Detta är nästa byggfokus — profilvyn + bevisgradering + desktop + rekryterarsök.

### Del 1 — Desktop-ramen (skalet)
Idag är UI:t låst i mobilkolumn. På desktop (≥1024px) går vi från en till **tre
kolumner**, men behåller den lugna, luftiga känslan — vi fyller inte ytan med brus.
- **Vänster (~220px):** beständig navigation (Spegeln, Flöde, Nätverk, Chatt,
  Möjligheter — samma poster som mobilens bottenmeny, nu vertikala ikon + etikett).
- **Mitt (~640px, centrerad):** innehållsscenen, byter med var man är.
- **Höger (~300px):** kontextuell — på profilen förtroende-panel + attestering, i
  flödet nätverksförslag. **Aldrig** reklam eller "personer du kanske känner"-spam.
- **Medvetet:** max innehållsbredd hålls nere även på stora skärmar (läsbar radlängd,
  luft) — motsatsen till LinkedIns kant-till-kant-kaos. Lugn = varumärket.

### Del 2 — Profilen (den vy som saknas idag)
Produktens viktigaste skärm: här bevisas eller faller "bevisat, inte påstått". Fyra zoner:
- **Zon A — Identitetshuvud.** Namn (seriff, stort), en **självvald inriktning** i
  monospace (t.ex. `Produktledare · omställning & datadrivna beslut`) — aldrig en
  jobbtitel (inriktning härleds ur vad man gjort). Till höger förtroendeindikatorn
  (zon D) — ingen poäng, en ärlig sammanfattning ("8 av 11 prestationer har kopplat
  utfall"). **Ingen** "öppen för jobb"-banner, inga följar-/kontaktsiffror — frånvaron
  av fåfänge-siffror ÄR varumärket.
- **Zon B — Ryggraden: beslut & utfall.** Kronologisk (eller efter tyngd) lista av
  prestationskort i Spegelns struktur: påstående i klarspråk → utfallsrad i den
  mintgröna faktarutan (`◆ Kopplat till utfall: "Minskade churn 12%"`) → bevisstatus.
- **Zon C — Bevisgradering (det nya, kritiska).** Varje prestation bär en av tre
  synliga statusar som monospace-taggar:
  - `○ självrapporterat` (grå) — sagt, inget mer. Ärligt märkt som obestyrkt.
  - `◐ kontextförankrat` (dämpad mint) — länkad mätning/tidslinje/dokument gör det troligt.
  - `● attesterat` (full mint) — en kontakt har intygat det, med kort motivering.
  **Avgörande beslut:** vi gömmer aldrig svaga påståenden, vi **märker** dem. En helt
  grå profil är i sig ärlig information till rekryteraren. (Knyter an till `ClaimKind`
  i koden: `quote`/`interpretation`/`verified` — `verified` reserverad, ännu oanvänd.)
- **Zon D — Förtroende-panel (höger).** Fördelning självrapporterat/kontextförankrat/
  attesterat som en enkel stapel + vilka kontakter som attesterat vad. Här kan
  besökaren agera: en **Kontakta**-knapp, gratis att ta emot (individen betalar aldrig).

### Del 3 — Attesteringsflödet (designa försiktigt)
Attestering ger bevisen värde men är där LinkedIn föll (gratis + obegränsat → värdelöst).
Motmedicin i UI:t: att attestera ger **inte** en tumme-upp utan en liten dialog som
kräver en **kort fritextmotivering** ("Jag satt i teamet och såg churn-siffrorna
före/efter"). Antalet attesteringar en person kan ge är **medvetet och synligt
begränsat** — knappheten är designad, vilket gör varje attestering socialt "dyr" och
därmed trovärdig.

### Del 4 — Rekryterarens sökvy (intäktssidan)
Intäkten kommer från efterfrågesidan → desktop behöver en **upptäcktsvy för
rekryterare** som känns som ett *verktyg*, inte ett flöde. Mitten = resultatlista av
profiler; sidorna = filter. Det avgörande filtret och vår faktiska produktvara:
**filtrering på bevisstatus** ("visa bara kandidater med *attesterad* erfarenhet av
produktomställning") — exakt det LinkedIn inte kan, och det rekryteraren betalar för
(sänker deras största kostnad: tid på uppblåsta CV:n). Varje träff visar en komprimerad
profilrad med förtroendeindikatorn synlig. **Enda ytan** som får ha "kommersiell"
densitet — här är användaren betalande och uppgiftsorienterad, inte en privatperson
att skydda.

### Designprinciper för dessa vyer
1. **Frånvaro är en funktion** — inga fåfänge-siffror, ingen reklam mot individen;
   tomrummet kommunicerar värderingen.
2. **Osäkerhet visas, döljs aldrig** — bevisgraderingen är ärlig snarare än smickrande.
3. **Knapphet skapar värde** — attestering är avsiktligt begränsad.
4. **Rekryteraren är den enda betalande, individen den skyddade** — enda ytan med
   kommersiell densitet är sökvyn.

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
- Byggt: **grundade inlägg**. Ett inlägg kan valfritt knytas till ett av
  författarens egna bevisade beslut — samma spårbarhet som profilen, nu på den
  sociala ytan (§6.5/§11). `Post.groundedIn` (ögonblicksbild), migration `0013`
  (`grounded_in jsonb`), en besluts-väljare i kompositorn och en "◆ Grundat i ett
  beslut"-chip i flödet. Grunden är **server-validerad**: bara ett beslut
  författaren faktiskt äger kan sättas, aldrig påhittad text (§8.3).
- Senare: rikare relevans.

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

### 6. Jobb & rekrytering — 🗺️ *planerad (nästa pelare)*
**Användarfråga (kandidat):** *"Vilka jobb passar det jag faktiskt gjort — utan
att jag ska behöva gissa rätt sökord?"*
**Användarfråga (arbetsgivare):** *"Hur når jag rätt kandidater utifrån bevisad
substans, inte uppblåsta CV:n?"*

**Smartare än LinkedIns sökdjungel.** LinkedIn är en djungel för att roller och
kompetenser är fritext — samma jobb har många titlar, varje kompetens många
synonymer, och sök blir nyckelordsmatchning över inkonsekvent text. Elevantly
vänder på det:
- **Ett kanoniskt begrepp per kompetens/roll.** Jobb OCH kandidater beskrivs i EN
  kanonisk skill-/rolltaxonomi (ESCO/SSYK). Synonymer och titelvarianter
  ("frontendutvecklare" / "webbutvecklare" / "UI-ingenjör") vikts in till samma
  begrepp — man söker begreppet, inte orden.
- **Jobb är strukturerade krav, inte prosa** — kanoniska kärnkompetenser
  (obligatoriska/önskade) + ansvarsnivå (`ResponsibilityLevel`), inte en fritextklump.
- **Matchning på struktur, förklarbart.** Kandidat↔jobb återanvänder
  `matchRoles`-filosofin (fas 5): en transparent poäng grundad i bevisade beslut
  (§8.3) — "du matchar för att dina beslut visar X". Aldrig en svart låda (§8.5).
- **Den grundade profilen ÄR ansökan** — ingen separat CV, ingen nyckelordsstoppning.
- **Sök på avsikt, inte nyckelord** — fritext normaliseras till kanoniska begrepp.

Bygger på: `Role`/`RoleCatalog`/`matchRoles`, `CapabilityClaim`/`Decision`, planerad
ESCO/SSYK. Nya delar: **arbetsgivarkonton** (ny aktör), **kanonisk taxonomi-tjänst**
(`SkillTaxonomy` bakom interface, §8.4 — v1 kurerad katalog + synonymlager, byts mot
ESCO/SSYK), **jobbannons-entitet** (strukturerade krav + RLS), **`matchJob`/sök**,
**ansökningsflöde** (kandidaten styr vad som delas, §9.3), **moderering** (återanvänder rapporter).

**Faser:** 6a kandidatmatchning först (värde utan arbetsgivare, §6.2 — seedade jobb,
`/jobs` med förklarbara träffar) · 6b arbetsgivarkonton + annonsering · 6c
ansökningar + granskning + samtycke · 6d full ESCO/SSYK-taxonomi (anti-djungel skarpt).

- Byggt (fas 6c): **ansökningar + arbetsgivargranskning + jobb-moderering.** Den
  grundade profilen ÄR ansökan — vid ansökan sparas en **samtyckt ögonblicksbild** av
  kandidatens beslut (+ namn/headline), så arbetsgivaren ser exakt vad kandidaten sökte
  med, aldrig den (kanske privata) live-profilen (§9.3). `Application` + `ApplicationRepository`
  (in-memory + Supabase), migration `0016` (`applications` + RLS: kandidat ser egna,
  företagets medlemmar ser företagets; söka bara som sig själv på ett publicerat jobb;
  en ansökan per jobb). Kandidat söker på `/jobs` (med valfritt meddelande) och ser
  "Dina ansökningar" med status; arbetsgivaren ser sökande per jobb på `/company/[id]`
  (ögonblicksbilden + granska/anta/avböj). Jobb kan **rapporteras** (`'job'` som
  rapport-typ) och flödar in i den befintliga granskningskön. **Pelare 6 komplett** i v1. `Job` fick
  status (`draft`/`published`/`closed`) + `companyId`; `JobRepository` (in-memory +
  Supabase) för att posta/lista/hantera. Migration `0015` (`jobs` + RLS: alla ser
  publicerade, medlemmar hanterar egna — återanvänder `is_company_member`).
  `/company/[id]` (arbetsgivarvy: posta/publicera/stänga) med en strukturerad
  postningsform där kraven **kryssas ur taxonomin, aldrig fritext**. `/jobs` läser nu
  riktiga publicerade jobb och matchar dem grundat (6a). Nästa: 6c (ansökningar).
- Byggt (fas 6b-1): **arbetsgivare som aktör — företag (självbetjänat).**
  `Company` + `CompanyRepository` (in-memory + Supabase), migration `0014`
  (`companies` + `company_members` + `create_company`/`is_company_member` som
  `security definer` — skapande + första medlemskap atomiskt, ingen kan gå med i
  någon annans företag; RLS: bara medlemmar ser sitt företag). `/company` (skapa +
  se dina företag) och "Företag" i kontomenyn. Nästa (6b-2): posta/hantera jobb.
- Byggt (fas 6a, första bricken): **kanonisk taxonomi + grundad jobbmatchning.**
  `SkillTaxonomy` (interface, §8.4) + `StaticSkillTaxonomy` (kurerad seed med synonymer)
  som viker in titelvarianter till ett begrepp — `canonicalizeTerm` återanvänder
  `normalizeText`/`tokenize`. `Job`/`JobCatalog` + seedade annonser (krav i kanoniska
  skill-id). `matchJobs` kanoniserar kandidatens kompetenser och matchar på begrepp
  (inte nyckelord), förklarbart och grundat (§8.3/§8.5). `/jobs` visar träffar med
  täckning + exakt bevisföring. Ingen ansökan/arbetsgivare än — kandidatvärde först.

**Aldrig (jobb-specifikt):** inga uppblåsta titlar som söksignal, ingen betald
synlighet före relevans (§8.5), ingen data säljs (§9), matchning måste gå att förklara.

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

- **Kanonisk skill-/rolltaxonomi (ESCO/SSYK)** — anti-djungel-motorn som driver
  pelare 6 (Jobb & rekrytering): ett begrepp per kompetens/roll, synonymer invikta.
  Bakom `SkillTaxonomy`-interfacet (§8.4) så v1 kan starta kurerat och bytas.
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
