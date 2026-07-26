import { EngineError } from "./errors";

/**
 * Tolkar en modells JSON-svar robust: tål ev. kodstaket och strö-text runt
 * objektet genom att plocka ut första `{` … sista `}`. Delas av alla motorer.
 * Misslyckad tolkning → EngineError. (Förankringsvalidering sker separat i
 * parseReflection.)
 */
export function extractJsonObject(text: string): unknown {
  const withoutFences = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  const candidate =
    start !== -1 && end !== -1 && end > start
      ? withoutFences.slice(start, end + 1)
      : withoutFences;

  try {
    return JSON.parse(candidate) as unknown;
  } catch (cause) {
    throw new EngineError("AI-motorn svarade inte med giltig JSON.", {
      cause,
    });
  }
}
