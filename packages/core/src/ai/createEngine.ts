import type { AIEngine } from "./engine";
import { ClaudeEngine, DEFAULT_CLAUDE_MODEL } from "./claudeEngine";
import { DEFAULT_OPENAI_MODEL, GptEngine } from "./gptEngine";
import { EngineError } from "./errors";

/**
 * Motorval — gör AI-lagret utbytbart i praktiken (CLAUDE.md 8.4). Env-fritt:
 * anroparen (webb-lagret) läser miljön och skickar in explicit config, så core
 * förblir portabelt och gör inga antaganden om körmiljön.
 */

export type AIProvider = "claude" | "openai";

export interface EngineConfig {
  /** Tvinga en viss motor. Utelämnas → härleds ur vilken nyckel som finns. */
  provider?: AIProvider;
  anthropicApiKey?: string;
  anthropicModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

export interface ResolvedEngine {
  engine: AIEngine;
  provider: AIProvider;
  /** Modellen som faktiskt kommer anropas (för loggning/utskrift). */
  model: string;
}

/**
 * Väljer och konstruerar en motor. Provider bestäms av `provider` om satt,
 * annars av vilken nyckel som finns (OpenAI först, sedan Claude). Saknas nyckel
 * för vald provider kastas EngineError.
 */
export function createEngine(config: EngineConfig): ResolvedEngine {
  const provider = resolveProvider(config);

  if (provider === "openai") {
    if (!config.openaiApiKey) throw new EngineError("OPENAI_API_KEY saknas.");
    const model = config.openaiModel || DEFAULT_OPENAI_MODEL;
    return {
      engine: new GptEngine({ apiKey: config.openaiApiKey, model }),
      provider,
      model,
    };
  }

  if (!config.anthropicApiKey) throw new EngineError("ANTHROPIC_API_KEY saknas.");
  const model = config.anthropicModel || DEFAULT_CLAUDE_MODEL;
  return {
    engine: new ClaudeEngine({ apiKey: config.anthropicApiKey, model }),
    provider,
    model,
  };
}

function resolveProvider(config: EngineConfig): AIProvider {
  if (config.provider) return config.provider;
  if (config.openaiApiKey) return "openai";
  if (config.anthropicApiKey) return "claude";
  throw new EngineError(
    "Ingen AI-motor konfigurerad: sätt OPENAI_API_KEY eller ANTHROPIC_API_KEY.",
  );
}
