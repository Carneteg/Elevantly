import { describe, expect, it } from "vitest";
import { createEngine } from "./createEngine";
import { ClaudeEngine, DEFAULT_CLAUDE_MODEL } from "./claudeEngine";
import { DEFAULT_OPENAI_MODEL, GptEngine } from "./gptEngine";
import { EngineError } from "./errors";

/**
 * Motorval — rent och deterministiskt (konstruerar bara klienter, inga
 * nätverksanrop). Bekräftar att AI-lagret faktiskt är utbytbart.
 */

describe("createEngine", () => {
  it("väljer OpenAI när bara OpenAI-nyckel finns", () => {
    const resolved = createEngine({ openaiApiKey: "sk-test" });
    expect(resolved.provider).toBe("openai");
    expect(resolved.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(resolved.engine).toBeInstanceOf(GptEngine);
  });

  it("väljer Claude när bara Anthropic-nyckel finns", () => {
    const resolved = createEngine({ anthropicApiKey: "sk-ant" });
    expect(resolved.provider).toBe("claude");
    expect(resolved.model).toBe(DEFAULT_CLAUDE_MODEL);
    expect(resolved.engine).toBeInstanceOf(ClaudeEngine);
  });

  it("föredrar OpenAI när båda nycklarna finns och ingen provider tvingas", () => {
    const resolved = createEngine({
      openaiApiKey: "sk-test",
      anthropicApiKey: "sk-ant",
    });
    expect(resolved.provider).toBe("openai");
  });

  it("respekterar en tvingad provider", () => {
    const resolved = createEngine({
      provider: "claude",
      openaiApiKey: "sk-test",
      anthropicApiKey: "sk-ant",
    });
    expect(resolved.provider).toBe("claude");
    expect(resolved.engine).toBeInstanceOf(ClaudeEngine);
  });

  it("respekterar modell-override per provider", () => {
    expect(
      createEngine({ openaiApiKey: "sk-test", openaiModel: "gpt-4o-mini" })
        .model,
    ).toBe("gpt-4o-mini");
    expect(
      createEngine({
        anthropicApiKey: "sk-ant",
        anthropicModel: "claude-opus-4-8",
      }).model,
    ).toBe("claude-opus-4-8");
  });

  it("kastar när vald provider saknar sin nyckel", () => {
    expect(() =>
      createEngine({ provider: "openai", anthropicApiKey: "sk-ant" }),
    ).toThrow(EngineError);
  });

  it("kastar när ingen nyckel alls finns", () => {
    expect(() => createEngine({})).toThrow(EngineError);
  });
});
