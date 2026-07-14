import type { AIEngine } from "../ai/engine";
import type { Reflection } from "../reflection";
import { parseReflection } from "./parse";

/**
 * Orkestrerar en spegling: kör fritexten genom motorn och förankringsvaliderar
 * svaret. Detta är produktlogiken — den lever i core (inte i UI:t) så att en
 * framtida app kan återanvända exakt samma flöde. Motorn väljs av anroparen,
 * så ingen leverantörslåsning läcker in hit.
 */
export async function runReflection(
  engine: AIEngine,
  rawText: string,
): Promise<Reflection> {
  const raw = await engine.reflect({ rawText });
  return parseReflection(raw, rawText);
}
