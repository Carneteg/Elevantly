import Anthropic from "@anthropic-ai/sdk";
import type { AIEngine, RawReflection, ReflectionInput } from "./engine";
import { buildReflectionPrompt } from "./prompt";
import { EngineError } from "./errors";
import { extractJsonObject } from "./json";

/**
 * Claude-implementationen av AIEngine (motor #1 i Spegeln v1).
 * Ingen nyckel läses här ur miljön — den skickas in explicit, så core förblir
 * portabelt (webb-lagret ansvarar för att läsa env och hålla nyckeln
 * server-side). GptEngine implementerar samma interface för OpenAI.
 */

/** Förnuftig standardmodell om ingen anges. Utbytbar via options/env. */
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5";

export interface ClaudeEngineOptions {
  apiKey: string;
  /** Valfri modell-override. Standard: DEFAULT_CLAUDE_MODEL. */
  model?: string;
  /** Valfri klient-injektion — främst för test. */
  client?: Anthropic;
}

export class ClaudeEngine implements AIEngine {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: ClaudeEngineOptions) {
    if (!options.apiKey && !options.client) {
      throw new EngineError("ANTHROPIC_API_KEY saknas.");
    }
    this.client =
      options.client ?? new Anthropic({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_CLAUDE_MODEL;
  }

  async reflect({ rawText }: ReflectionInput): Promise<RawReflection> {
    const { system, user } = buildReflectionPrompt(rawText);

    let message: Anthropic.Message;
    try {
      message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      });
    } catch (cause) {
      throw new EngineError("Kunde inte nå AI-motorn.", { cause });
    }

    return extractJsonObject(extractText(message));
  }
}

/** Slår ihop alla text-block ur ett Claude-svar. */
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter(
      (block): block is Anthropic.TextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("")
    .trim();
}
