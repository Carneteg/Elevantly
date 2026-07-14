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
  /** Kompetenser handlingen visar. Kan vara tom. */
  capabilities: string[];
  /**
   * Exakt textutdrag ur användarens input som posten härleds från.
   * Obligatorisk — driver förankringen ("Grundat på: ..."). Utan spårbar
   * källa visas posten aldrig (CLAUDE.md 8.3).
   */
  sourceText: string;
}
