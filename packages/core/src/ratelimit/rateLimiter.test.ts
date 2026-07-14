import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./rateLimiter";

/**
 * Rate-limitern testas deterministiskt med en injicerad klocka — ingen riktig
 * tid, inga riktiga nätverksanrop.
 */

function fixedClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("InMemoryRateLimiter", () => {
  it("tillåter upp till gränsen och nekar därefter", async () => {
    const clock = fixedClock();
    const limiter = new InMemoryRateLimiter({
      limit: 3,
      windowMs: 60_000,
      now: clock.now,
    });

    for (let i = 0; i < 3; i++) {
      const result = await limiter.check("1.2.3.4");
      expect(result.allowed).toBe(true);
    }

    const denied = await limiter.check("1.2.3.4");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.remaining).toBe(0);
  });

  it("räknar nycklar oberoende av varandra", async () => {
    const clock = fixedClock();
    const limiter = new InMemoryRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: clock.now,
    });

    expect((await limiter.check("a")).allowed).toBe(true);
    expect((await limiter.check("a")).allowed).toBe(false);
    // Annan nyckel påverkas inte.
    expect((await limiter.check("b")).allowed).toBe(true);
  });

  it("tillåter igen när fönstret glidit förbi", async () => {
    const clock = fixedClock();
    const limiter = new InMemoryRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: clock.now,
    });

    expect((await limiter.check("ip")).allowed).toBe(true);
    expect((await limiter.check("ip")).allowed).toBe(true);
    expect((await limiter.check("ip")).allowed).toBe(false);

    // Strax innan fönstret gått ut: fortfarande nekad.
    clock.advance(59_000);
    expect((await limiter.check("ip")).allowed).toBe(false);

    // Efter att fönstret passerat: tillåten igen.
    clock.advance(2_000);
    expect((await limiter.check("ip")).allowed).toBe(true);
  });

  it("nekade försök förbrukar inte en plats", async () => {
    const clock = fixedClock();
    const limiter = new InMemoryRateLimiter({
      limit: 1,
      windowMs: 10_000,
      now: clock.now,
    });

    expect((await limiter.check("ip")).allowed).toBe(true);
    // Flera nekade i rad ska inte skjuta fönstret framåt.
    await limiter.check("ip");
    await limiter.check("ip");

    // Efter att den ursprungliga träffen glidit ut: tillåten igen.
    clock.advance(10_001);
    expect((await limiter.check("ip")).allowed).toBe(true);
  });

  it("validerar konstruktorargument", () => {
    expect(() => new InMemoryRateLimiter({ limit: 0, windowMs: 1000 })).toThrow();
    expect(() => new InMemoryRateLimiter({ limit: 1, windowMs: 0 })).toThrow();
  });
});
