import type { Decision } from "./decision";

/**
 * Ett påstående om personen som är förankrat i deras egen text.
 * `sourceText` är det exakta utdrag påståendet vilar på ("Grundat på: ...").
 */
export interface GroundedClaim {
  /** Påståendet om vad personen är bra på. */
  statement: string;
  /** Exakt textutdrag ur användarens input som påståendet vilar på. */
  sourceText: string;
}

/**
 * En roll som personens beslut pekar mot, med motivering och förankring.
 */
export interface RoleSuggestion {
  /** Rolltyp handlingarna pekar mot (t.ex. "Operations Lead"). */
  role: string;
  /** Kort motivering till varför beslutet pekar hit. */
  rationale: string;
  /** Exakt textutdrag ur användarens input som förslaget vilar på. */
  sourceText: string;
}

/**
 * Spegelns svar på användarfrågan: "Vad säger det jag faktiskt gjort om vad
 * jag är bra på — och vilka roller det pekar mot?"
 *
 * Allt här är förankringsvaliderat: varje post bär ett `sourceText` som
 * återfinns i användarens egen input. Inget visas som fakta utan spårbar källa.
 */
export interface Reflection {
  /** Strukturerade beslutsposter härledda ur fritexten. */
  decisions: Decision[];
  /** Vad personen är bra på — varje påstående förankrat. */
  strengths: GroundedClaim[];
  /** Roller besluten pekar mot — varje förslag förankrat. */
  roles: RoleSuggestion[];
  /**
   * En enda uppföljningsfråga som bjuder in till att berätta mer
   * (copilot-känsla, spegeln-v1-spec). Inget sparas mellan besök.
   */
  followUpQuestion: string;
}
