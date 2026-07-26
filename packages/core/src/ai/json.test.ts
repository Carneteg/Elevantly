import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./json";
import { EngineError } from "./errors";

/**
 * Delad JSON-extraktion som båda motorerna använder. Ren och nätverksfri.
 */

describe("extractJsonObject", () => {
  it("tolkar rent JSON", () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("tål kodstaket runt objektet", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("plockar ut objektet ur strö-text runt omkring", () => {
    const raw = 'Här är svaret:\n{"a":1, "b":"x"}\nHoppas det hjälper!';
    expect(extractJsonObject(raw)).toEqual({ a: 1, b: "x" });
  });

  it("kastar EngineError på ogiltig JSON", () => {
    expect(() => extractJsonObject("inte json alls")).toThrow(EngineError);
  });
});
