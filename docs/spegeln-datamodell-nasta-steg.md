# Spegeln — datamodell, nästa steg

> Status: **implementerad**. Punkterna nedan är byggda i `@elevantly/core`
> (`CapabilityClaim`, `ResponsibilityLevel` på `Decision`) och testade.
> Kompletterar CLAUDE.md (dataprinciperna) och `docs/spegeln-v1-spec.md`.
> Ändringar kräver beslut av produktägaren.

Bakgrund: en granskning av Spegeln v1 (PR #1) landade i att den verkliga
tillitsrisken inte är *quote vs interpretation* utan i **ansvarsnivå** — att
systemet inte får tillskriva användaren mer ägarskap över en handling än
texten stödjer. `Decision.kind = "quote"` behålls; nedanstående adresserar
ansvar och capability-tillit.

## 1. Typade capabilities (i stället för `string[]`)

Idag är `Decision.capabilities` en `string[]` och visas i UI:t som inferens
("Kompetenser detta kan peka på:"). Det räcker för v1, men en framtida klient
skulle av misstag kunna visa en capability som verifierad fakta.

Nästa steg: gör varje capability till ett typat objekt med egen härkomst:

```ts
interface CapabilityClaim {
  name: string;
  kind: ClaimKind;        // i praktiken "interpretation" — aldrig "verified" utan grund
  confidence: "low" | "medium" | "high";
  sources: string[];      // ordagranna citat, samma förankringskrav som övriga poster
}
```

Så bär varje capability sin egen `kind`, `confidence` och `sources` — och
ingen yta kan råka presentera en inferens som ett konstaterande.

**Implementerat:** `parseReflection` filtrerar bort en capability som saknar
minst ett ordagrant förankrat citat, sätter `kind` deterministiskt till
`"interpretation"` (aldrig `"verified"`, aldrig från motorn) och defaultar
`confidence` konservativt till `"low"` när den saknas/är ogiltig. UI:t visar
namn + tilltro, tydligt som AI-tolkning.

## 2. Ansvarsnivå (responsibility level)

Datamodellen skiljer idag inte på om användaren *deltog i* eller *ägde* en
handling. Lägg till en explicit ansvarsnivå på `Decision`:

```ts
type ResponsibilityLevel =
  | "participated"
  | "contributed"
  | "led"
  | "owned"
  | "unknown";
```

Regler som måste följa med:
- **AI:n får aldrig tillskriva en högre ansvarsnivå än texten uttryckligen
  stödjer.** Saknas stöd → `"unknown"`.
- Nivån härleds, precis som allt annat, ur förankrade citat och sätts under
  samma deterministiska validering som `kind` (produktlogiken, inte motorn,
  har sista ordet).
- UI:t får aldrig formulera en handling som att användaren ägde eller fattade
  ett beslut om nivån inte stödjer det.

**Implementerat:** produktlogiken beräknar den högsta nivå de förankrade
citaten uttryckligen stödjer (via konservativa, justerbara textmarkörer i
`parse.ts`) och kapar motorns förslag ner till den — motorns förslag kan bara
sänka, aldrig höja. Avstår motorn (`"unknown"`) låter vi texten bestämma;
saknas textstöd blir nivån `"unknown"`. UI:t formulerar nivån ärligt
("Du beskriver att du deltog i …" vs "… ledde …") och visar inget alls vid
`"unknown"`. Textmarkörerna är en medveten guard, inte fritextdriven logik —
de kan bara sänka en nivå.

## Status

Byggt och testat. `Decision`, `ClaimKind` och AI-lagret förblev rena och
återanvändbara — tilläggen krävde ingen omskrivning av grunden. Byggdes när de
tjänade en namngiven användarfråga (CLAUDE.md 7.1).
