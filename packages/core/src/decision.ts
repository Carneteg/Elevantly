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
  /** Kompetenser handlingen kan peka på (AI-inferens, inte konstaterande). */
  capabilities: string[];
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
