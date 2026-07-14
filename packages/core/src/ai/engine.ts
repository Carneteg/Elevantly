/**
 * AI-lagret — abstraherat bakom ett interface så motorn kan bytas utan att
 * röra produktlogiken (CLAUDE.md 8.4, spegeln-v1-spec). Claude är motor #1;
 * en GPT-motor kan implementera samma interface senare utan omskrivning.
 */

export interface ReflectionInput {
  /** Användarens råa fritext om vad de gjort i jobbet. */
  rawText: string;
}

/**
 * Ostrukturerat svar från en AI-motor (tolkad JSON). Detta är ÄNNU INTE
 * förankringsvaliderat — `parseReflection` validerar det mot användarens
 * text innan något får visas som fakta.
 */
export type RawReflection = unknown;

/**
 * En utbytbar AI-motor. Enda ansvaret: ta emot fritext, returnera ett rått
 * struktureringsförslag. All förankring/validering sker utanför motorn, så
 * ingen motor kan smita förbi kravet på spårbar källa.
 */
export interface AIEngine {
  reflect(input: ReflectionInput): Promise<RawReflection>;
}
