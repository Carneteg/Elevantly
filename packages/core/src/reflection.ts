import type { ClaimKind, Decision } from "./decision";

/**
 * Ett påstående om personen som är förankrat i deras egen text.
 *
 * Detta är en AI-TOLKNING, inte ett konstaterande. `sources` är de ordagranna
 * utdrag tolkningen härletts från och `kind` är alltid `"interpretation"` i v1 —
 * UI:t får aldrig visa den som verifierad fakta (CLAUDE.md 8.3).
 */
export interface GroundedClaim {
  /** Tolkningen av vad personen är bra på. */
  statement: string;
  /** Ordagranna utdrag ur användarens input som tolkningen härletts från. */
  sources: string[];
  /** Ärlighetsmarkör. `"interpretation"` i v1. */
  kind: ClaimKind;
}

/**
 * En roll som personens beslut skulle kunna peka mot. Presenteras som en
 * MÖJLIG RIKTNING, aldrig som ett konstaterande — `kind` är `"interpretation"`.
 */
export interface RoleSuggestion {
  /** Rolltyp handlingarna kan peka mot (t.ex. "Head of Customer Operations"). */
  role: string;
  /** Kort motivering till varför beslutet kan peka hit. */
  rationale: string;
  /** Ordagranna utdrag ur användarens input som förslaget härletts från. */
  sources: string[];
  /** Ärlighetsmarkör. `"interpretation"` i v1. */
  kind: ClaimKind;
}

/**
 * Spegelns svar på användarfrågan: "Vad säger det jag faktiskt gjort om vad
 * jag är bra på — och vilka roller det pekar mot?"
 *
 * Allt här är förankringsvaliderat: varje post bär minst ett `source` som
 * återfinns ordagrant i användarens egen input. Förankringen är ett
 * NÖDVÄNDIGT men inte tillräckligt villkor — den bevisar att citatet finns,
 * inte att tolkningen följer av det. Därför bär varje rad en `kind` som styr
 * hur ärligt den får presenteras.
 */
export interface Reflection {
  /** Strukturerade beslutsposter härledda ur fritexten (vilar på citat). */
  decisions: Decision[];
  /** Tolkningar av vad personen är bra på — varje förankrad. */
  strengths: GroundedClaim[];
  /** Möjliga riktningar besluten kan peka mot — varje förankrad. */
  roles: RoleSuggestion[];
  /**
   * En enda uppföljningsfråga som bjuder in till att berätta mer
   * (copilot-känsla, spegeln-v1-spec). Inget sparas mellan besök.
   */
  followUpQuestion: string;
}
