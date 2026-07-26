import OpenAI from "openai";
import type { AIEngine, RawReflection, ReflectionInput } from "./engine";
import { buildReflectionPrompt } from "./prompt";
import { EngineError } from "./errors";
import { extractJsonObject } from "./json";

/**
 * OpenAI-implementationen av AIEngine. Samma interface och samma
 * (motoragnostiska) prompt som ClaudeEngine — motorn kan bytas utan att röra
 * produktlogiken (CLAUDE.md 8.4). Ingen nyckel läses ur miljön här; den skickas
 * in explicit så att core förblir portabelt.
 */

/** Förnuftig standardmodell om ingen anges. Utbytbar via options/env. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o";

export interface GptEngineOptions {
  apiKey: string;
  /** Valfri modell-override. Standard: DEFAULT_OPENAI_MODEL. */
  model?: string;
  /** Valfri klient-injektion — främst för test. */
  client?: OpenAI;
}

export class GptEngine implements AIEngine {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: GptEngineOptions) {
    if (!options.apiKey && !options.client) {
      throw new EngineError("OPENAI_API_KEY saknas.");
    }
    this.client = options.client ?? new OpenAI({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_OPENAI_MODEL;
  }

  async reflect({ rawText }: ReflectionInput): Promise<RawReflection> {
    const { system, user } = buildReflectionPrompt(rawText);

    let content: string;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        // JSON-läge → robust maskinläsbart svar. Kräver att ordet "json" finns
        // i indata, därav suffixet nedan.
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${user}\n\nSvara med ett giltigt json-objekt.` },
        ],
      });
      content = completion.choices[0]?.message?.content ?? "";
    } catch (cause) {
      throw new EngineError("Kunde inte nå AI-motorn.", { cause });
    }

    return extractJsonObject(content);
  }
}
