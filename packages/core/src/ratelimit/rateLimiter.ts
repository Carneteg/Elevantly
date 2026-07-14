/**
 * Rate limiting-lagret — abstraherat bakom ett interface, precis som AIEngine
 * (CLAUDE.md 8.4). In-memory-implementationen räcker för demo/enkel drift; en
 * delad store (Redis e.d.) kan kopplas in senare genom att implementera samma
 * interface, utan att route-logiken rörs.
 *
 * `check` är async så att en nätverksbackad store kan bytas in utan att ändra
 * anroparen.
 */

export interface RateLimitResult {
  /** Ryms förfrågan inom gränsen? */
  allowed: boolean;
  /** Sekunder tills nästa försök tillåts (för Retry-After). 0 när `allowed`. */
  retryAfterSeconds: number;
  /** Gränsen som gäller (antal per fönster). */
  limit: number;
  /** Återstående förfrågningar i nuvarande fönster. */
  remaining: number;
}

export interface RateLimiter {
  /**
   * Registrerar ett försök för `key` (t.ex. en IP) och säger om det ryms inom
   * gränsen. Nekade försök förbrukar inte en plats och förlänger inte fönstret.
   */
  check(key: string): Promise<RateLimitResult>;
}

export interface InMemoryRateLimiterOptions {
  /** Max antal tillåtna förfrågningar per fönster. */
  limit: number;
  /** Fönstrets längd i millisekunder. */
  windowMs: number;
  /** Injicerbar klocka (för test). Standard: Date.now. */
  now?: () => number;
}

/**
 * Enkel glidande-fönster-rate-limit i minnet.
 *
 * OBS: tillståndet lever i processens minne och är därför **per-instans** —
 * det delas INTE mellan flera servrar/instanser och överlever inte en omstart.
 * Det duger för demo och enkel drift, men är **inte distributionssäkert**.
 * Inför skalning: byt till en delad store (Redis e.d.) bakom `RateLimiter`.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  /** key → tidsstämplar för förfrågningar inom det aktuella fönstret. */
  private readonly hits = new Map<string, number[]>();

  constructor(options: InMemoryRateLimiterOptions) {
    if (options.limit < 1) throw new Error("limit måste vara minst 1.");
    if (options.windowMs < 1) throw new Error("windowMs måste vara minst 1.");
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.now = options.now ?? (() => Date.now());
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = this.now();
    const windowStart = now - this.windowMs;

    // Behåll bara tidsstämplar inom fönstret.
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      const retryAfterMs = oldest + this.windowMs - now;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        limit: this.limit,
        remaining: 0,
      };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return {
      allowed: true,
      retryAfterSeconds: 0,
      limit: this.limit,
      remaining: this.limit - recent.length,
    };
  }
}
