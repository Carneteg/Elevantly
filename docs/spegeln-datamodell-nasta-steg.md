# Spegeln — datamodell, nästa steg

> Status: beslutade nästa steg, **ej implementerade** och **inte blockerande
> för v1**. Kompletterar CLAUDE.md (dataprinciperna) och
> `docs/spegeln-v1-spec.md`. Ändringar kräver beslut av produktägaren.

Bakgrund: en granskning av Spegeln v1 (PR #1) landade i att den verkliga
tillitsrisken inte är *quote vs interpretation* utan i **ansvarsnivå** — att
systemet inte får tillskriva användaren mer ägarskap över en handling än
texten stödjer. `Decision.kind = "quote"` behålls; nedanstående adresserar
ansvar och capability-tillit i en kommande datamodellsomgång.

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

## Varför inte i v1

v1 bevisar kärntesen (förankrade handlingar → värde direkt) med minsta möjliga
yta. Ovanstående är renodlade datamodellstillägg som kan läggas på utan att
kasta om grunden: `Decision`, `ClaimKind` och AI-lagret är redan rena och
återanvändbara. De byggs när de tjänar en namngiven användarfråga (CLAUDE.md
7.1), inte innan.
