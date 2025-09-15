export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
};

export type CircuitBreakerOptions = {
  failureThreshold?: number;
  cooldownPeriodMs?: number;
  successThreshold?: number;
};

export type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type CircuitBreaker = {
  state: BreakerState;
  failureCount: number;
  successCount: number;
  nextAttempt: number;
};
