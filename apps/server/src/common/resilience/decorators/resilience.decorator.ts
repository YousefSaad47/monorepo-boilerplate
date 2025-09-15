import { SetMetadata } from "@nestjs/common";

import { CircuitBreakerOptions, RetryOptions } from "@/common/resilience/types";

export const RETRY_OPTIONS = "RETRY_OPTIONS";
export const CIRCUIT_OPTIONS = "CIRCUIT_OPTIONS";

export const Retry = (opts: RetryOptions = {}) =>
  SetMetadata(RETRY_OPTIONS, opts);

export const CircuitBreaker = (opts: CircuitBreakerOptions = {}) =>
  SetMetadata(CIRCUIT_OPTIONS, opts);
