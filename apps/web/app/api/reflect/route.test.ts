import { beforeAll, describe, expect, it } from "vitest";
import { POST } from "./route";

/**
 * Gränsfallstester för route-härdningen — utan riktig API-nyckel. Vi säkrar att
 * nyckeln är otillsatt så att motorn aldrig anropas; alla giltiga men
 * nyckellösa anrop landar i 503, medan 400/429 slår före dess.
 *
 * Rate-limitern är en modulnivå-singleton, så varje test använder en egen IP
 * för att inte störa varandra.
 */

beforeAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

function post(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/reflect", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/reflect — hårda gränser", () => {
  it("avvisar för lång input med 400 innan motorn anropas", async () => {
    const tooLong = "a".repeat(8001);
    const res = await POST(post({ text: tooLong }, "10.0.0.1"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/för lång/i);
  });

  it("avvisar tom input med 400", async () => {
    const res = await POST(post({ text: "   " }, "10.0.0.2"));
    expect(res.status).toBe(400);
  });

  it("släpper igenom en förfrågan under gränsen (ej 429)", async () => {
    const res = await POST(post({ text: "Jag ledde ett team." }, "10.0.0.3"));
    expect(res.status).not.toBe(429);
  });

  it("slår in rate limit med 429 och Retry-After efter tröskeln", async () => {
    const ip = "203.0.113.9";
    // De första 10 ryms (returnerar 503 eftersom nyckel saknas — inte 429).
    for (let i = 0; i < 10; i++) {
      const res = await POST(post({ text: "hej" }, ip));
      expect(res.status).not.toBe(429);
    }
    // Den 11:e nekas.
    const denied = await POST(post({ text: "hej" }, ip));
    expect(denied.status).toBe(429);
    expect(denied.headers.get("Retry-After")).toBeTruthy();
    const body = (await denied.json()) as { error: string };
    expect(body.error).toMatch(/för många förfrågningar/i);
  });
});
