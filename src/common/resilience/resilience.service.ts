/** biome-ignore-all lint/style/noNonNullAssertion: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import chalk from "chalk";
import { PinoLogger } from "nestjs-pino";

import { CircuitBreaker, CircuitBreakerOptions, RetryOptions } from "./types";

@Injectable()
export class ResilienceService {
  private readonly defaultRetryOptions = {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    jitter: true,
  } satisfies Required<RetryOptions>;

  private readonly defaultBreakerOptions = {
    failureThreshold: 5,
    cooldownPeriodMs: 10_000,
    successThreshold: 2,
  } satisfies Required<CircuitBreakerOptions>;

  private breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ResilienceService.name);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getDelay(opts: RetryOptions, attempt: number) {
    const { baseDelayMs, maxDelayMs, jitter } = opts;

    let delay = Math.min(baseDelayMs! * 2 ** attempt, maxDelayMs!);

    if (jitter) {
      delay = Math.floor(Math.random() * delay);
    }

    return delay;
  }

  public async retry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T>;
  public async retry<T>(
    db: { transaction: (fn: (tx: any) => Promise<T>) => Promise<T> },
    fn: (tx: any) => Promise<T>,
    opts?: RetryOptions,
  ): Promise<T>;

  public async retry<T>(
    arg1:
      | (() => Promise<T>)
      | { transaction: (fn: (tx: any) => Promise<T>) => Promise<T> },
    arg2?: ((tx: any) => Promise<T>) | RetryOptions,
    arg3?: RetryOptions,
  ): Promise<T> {
    const fn = this.normalizeExecution(arg1, arg2);
    const opts = this.normalizeOptions(arg2, arg3);

    return this._retry(fn, opts);
  }

  private async _retry<T>(
    fn: () => Promise<T>,
    opts: RetryOptions,
    attempt = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= opts.maxRetries!) {
        throw err;
      }

      const delay = this.getDelay(opts, attempt);

      this.logger.warn(
        chalk.yellow(
          `attempt=${attempt + 1}, delay=${delay}ms, error=${err.message}`,
        ),
      );

      await this.delay(delay);
      return this._retry(fn, opts, attempt + 1);
    }
  }

  private normalizeExecution<T>(
    arg1:
      | (() => Promise<T>)
      | { transaction: (fn: (tx: any) => Promise<T>) => Promise<T> },
    arg2?: ((tx: any) => Promise<T>) | RetryOptions,
  ) {
    if (typeof arg1 === "function") {
      return arg1;
    }

    const db = arg1;
    const fn = arg2 as (tx: any) => Promise<T>;

    return async () => db.transaction(fn);
  }

  private normalizeOptions(
    arg2?: ((tx: any) => Promise<unknown>) | RetryOptions,
    arg3?: RetryOptions,
  ): RetryOptions {
    const opts =
      (typeof arg2 === "object" && !("then" in arg2) ? arg2 : arg3) || {};
    return { ...this.defaultRetryOptions, ...opts };
  }

  public async circuitBreaker<T>(
    key: string,
    fn: () => Promise<T>,
    _opts?: CircuitBreakerOptions,
  ): Promise<T> {
    const opts = { ...this.defaultBreakerOptions, ..._opts };

    const breaker = this.getBreaker(key);

    if (breaker.state === "OPEN") {
      if (breaker.nextAttempt > Date.now()) {
        throw new InternalServerErrorException(
          `Circuit breaker for ${key} is OPEN (fail fast)`,
        );
      }

      breaker.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess(breaker, opts);
      return result;
    } catch (err) {
      this.onFailure(breaker, opts, err);
      throw err;
    }
  }

  private onSuccess(
    breaker: CircuitBreaker,
    opts: Required<CircuitBreakerOptions>,
  ) {
    if (breaker.state === "HALF_OPEN") {
      breaker.successCount++;

      if (breaker.successCount >= opts.successThreshold) {
        this.logger.info("CircuitBreaker: CLOSED again after successes");
        this.reset(breaker);
      }
    } else {
      breaker.failureCount = 0;
    }
  }

  private onFailure(
    breaker: CircuitBreaker,
    opts: Required<CircuitBreakerOptions>,
    err: Error,
  ) {
    breaker.failureCount++;

    if (breaker.failureCount >= opts.failureThreshold) {
      breaker.state = "OPEN";
      breaker.nextAttempt = Date.now() + opts.cooldownPeriodMs;
      this.logger.warn(
        { err, nextAttempt: new Date(breaker.nextAttempt) },
        "CircuitBreaker: OPEN",
      );
    }
  }

  private reset(breaker: CircuitBreaker) {
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.state = "CLOSED";
  }

  private getBreaker(key: string) {
    if (!this.breakers.has(key)) {
      this.breakers.set(key, {
        state: "CLOSED",
        failureCount: 0,
        successCount: 0,
        nextAttempt: Date.now(),
      });
    }
    return this.breakers.get(key)!;
  }
}
