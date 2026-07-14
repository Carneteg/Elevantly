/**
 * Hur en rad ska förstås av användaren — en ärlighetsmarkör som styr hur den
 * får presenteras. Vi får aldrig låta en tolkning kännas mer verifierad än den
 * är; datatillit är hela poängen (CLAUDE.md 8.3).
 *
 * - `quote`         Vilar på användarens egna ord (ordagrant citat i texten).
 *                   Det närmaste ett konstaterande vi kommer i v1.
 * - `interpretation` AI:ns tolkning härledd FRÅN ett citat (styrkor, riktningar).
 *                   Visas aldrig som fakta, alltid som tolkning.
 * - `verified`      Reserverad. ANVÄNDS INTE i v1 — finns bara för framtiden
 *                   (t.ex. när ett utfall kan styrkas mot en extern källa).
 */
export type ClaimKind = "quote" | "interpretation" | "verified";

/** Hur säker en inferens är. Konservativ som standard (låg). */
export type Confidence = "low" | "medium" | "high";

/**
 * En kompetens handlingen kan peka på. Detta är en AI-TOLKNING, inte ett
 * konstaterande — därför bär den sin egen härkomst (`kind`, `confidence`,
 * `sources`) så att ingen yta av misstag kan visa den som verifierad fakta.
 */
export interface CapabilityClaim {
  /** Kompetensens namn. */
  name: string;
  /**
   * Ärlighetsmarkör. Alltid `"interpretation"` i v1 — sätts deterministiskt av
   * produktlogiken, aldrig av AI-motorn, och blir aldrig `"verified"`.
   */
  kind: ClaimKind;
  /** Hur säker tolkningen är. */
  confidence: Confidence;
  /**
   * Ordagranna citat ur användarens text som kompetensen härletts från. Minst
   * ett — utan spårbar källa filtreras kompetensen bort (CLAUDE.md 8.3).
   */
  sources: string[];
}

/**
 * Vilken ansvarsnivå användarens egen text stödjer för en handling. Systemet
 * får ALDRIG tillskriva en högre nivå än texten uttryckligen stödjer; saknas
 * stöd → `"unknown"`. Nivån sätts deterministiskt av produktlogiken (inte
 * motorn), samma mönster som `kind`.
 */
export type ResponsibilityLevel =
  | "participated"
  | "contributed"
  | "led"
  | "owned"
  | "unknown";

/**
 * Decision — Elevantlys grundenhet (CLAUDE.md 7.2: beslut & utfall framför titlar).
 *
 * En Decision är ett bevisat beslut/handling som personen faktiskt gjort.
 * Detta är STRUKTURERAD data och driver systemets resonemang. Användarens
 * råa fritext får visas, men driver aldrig logiken (CLAUDE.md 7.3).
 *
 * Modellen gör inga antaganden om anonymitet eller "en enda användare" — den
 * beskriver bara handlingen. Ägarskap/konton kan läggas ovanpå senare utan
 * att röra denna typ (spegeln-v1-spec: "blockera inte arkitekturen").
 */
export interface Decision {
  /** Vad personen gjorde. Obligatorisk. */
  action: string;
  /** Omständigheter, tidsram. Valfri. */
  context?: string;
  /** Mätbart utfall om det finns ("minskade churn 12%"). Valfri. */
  outcome?: string;
  /**
   * Kompetenser handlingen kan peka på. Typade tolkningar (inte konstateranden):
   * varje bär egen `confidence` och förankring. Kan vara tom.
   */
  capabilities: CapabilityClaim[];
  /**
   * Ansvarsnivå som användarens text stödjer för handlingen. Sätts
   * deterministiskt av produktlogiken och aldrig högre än texten stödjer.
   */
  responsibility: ResponsibilityLevel;
  /**
   * Ordagranna textutdrag ur användarens input som posten vilar på. Minst ett —
   * driver förankringen ("Du skrev: ..."). Utan minst en spårbar källa visas
   * posten aldrig (CLAUDE.md 8.3). Flera tillåts när posten bygger på mer än
   * en handling.
   */
  sources: string[];
  /**
   * Ärlighetsmarkör. En Decision vilar på användarens egna ord → `quote`.
   * Sätts deterministiskt av produktlogiken, aldrig av AI-motorn. Aldrig
   * `verified` i v1.
   */
  kind: ClaimKind;
}
