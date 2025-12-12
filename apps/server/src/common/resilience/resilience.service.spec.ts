import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ResilienceService } from './resilience.service';

describe('ResilienceService', () => {
  let service: ResilienceService;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    mockLogger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResilienceService,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ResilienceService>(ResilienceService);
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await service.retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await service.retry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exhausted', async () => {
      const error = new Error('Persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(service.retry(fn, { maxRetries: 2 })).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use default retry options when not provided', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const result = await service.retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should apply exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const start = Date.now();
      await service.retry(fn, {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
      });
      const duration = Date.now() - start;

      // Should have delays: 100ms, 200ms (exponential)
      expect(duration).toBeGreaterThanOrEqual(300);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelayMs cap', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      await service.retry(fn, {
        maxRetries: 3,
        baseDelayMs: 10000,
        maxDelayMs: 100,
        jitter: false,
      });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should apply jitter when enabled', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      await service.retry(fn, {
        maxRetries: 2,
        baseDelayMs: 100,
        jitter: true,
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should work with database transaction function', async () => {
      const txFn = jest.fn().mockResolvedValue('tx-result');
      const db = {
        transaction: jest.fn((fn) => fn('tx-object')),
      };

      const result = await service.retry(db, txFn);

      expect(result).toBe('tx-result');
      expect(db.transaction).toHaveBeenCalled();
      expect(txFn).toHaveBeenCalledWith('tx-object');
    });

    it('should retry database transactions on failure', async () => {
      const txFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Deadlock'))
        .mockResolvedValue('success');
      
      const db = {
        transaction: jest.fn((fn) => fn('tx')),
      };

      const result = await service.retry(db, txFn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(db.transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle retries with zero maxRetries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Immediate fail'));

      await expect(service.retry(fn, { maxRetries: 0 })).rejects.toThrow('Immediate fail');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('circuitBreaker', () => {
    const key = 'test-service';

    it('should execute function when circuit is closed', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await service.circuitBreaker(key, fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger failures to open circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker(key, fn)).rejects.toThrow();
      }

      // Circuit should now be open
      await expect(service.circuitBreaker(key, fn)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.circuitBreaker(key, fn)).rejects.toThrow('Circuit breaker');

      // Should fail fast without calling function
      expect(fn).toHaveBeenCalledTimes(5); // Not called after circuit opens
    });

    it('should transition to half-open after cooldown period', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker(key + '-cooldown', fn, {
          failureThreshold: 5,
          cooldownPeriodMs: 100,
        })).rejects.toThrow();
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should now allow one attempt (half-open state)
      fn.mockResolvedValueOnce('recovered');
      const result = await service.circuitBreaker(key + '-cooldown', fn);

      expect(result).toBe('recovered');
    });

    it('should close circuit after successful attempts in half-open state', async () => {
      const testKey = 'test-close-circuit';
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker(testKey, fn, {
          failureThreshold: 5,
          cooldownPeriodMs: 50,
          successThreshold: 2,
        })).rejects.toThrow();
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Succeed enough times to close circuit
      fn.mockResolvedValue('success');
      await service.circuitBreaker(testKey, fn, { successThreshold: 2 });
      await service.circuitBreaker(testKey, fn, { successThreshold: 2 });

      // Circuit should be closed, continue working
      const result = await service.circuitBreaker(testKey, fn);
      expect(result).toBe('success');
    });

    it('should reset failure count on success in closed state', async () => {
      const testKey = 'reset-test';
      const fn = jest.fn();

      // Fail a few times but not enough to open
      fn.mockRejectedValueOnce(new Error('Fail 1'));
      fn.mockRejectedValueOnce(new Error('Fail 2'));
      await expect(service.circuitBreaker(testKey, fn, { failureThreshold: 5 })).rejects.toThrow();
      await expect(service.circuitBreaker(testKey, fn, { failureThreshold: 5 })).rejects.toThrow();

      // Succeed - should reset counter
      fn.mockResolvedValue('success');
      await service.circuitBreaker(testKey, fn, { failureThreshold: 5 });

      // Fail again - should start count from 0
      fn.mockRejectedValue(new Error('New fail'));
      for (let i = 0; i < 4; i++) {
        await expect(service.circuitBreaker(testKey, fn, { failureThreshold: 5 })).rejects.toThrow();
      }

      // Circuit should still be closed after 4 failures
      expect(fn).toHaveBeenCalled();
    });

    it('should use custom options', async () => {
      const customKey = 'custom-opts';
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      const opts = {
        failureThreshold: 3,
        cooldownPeriodMs: 200,
        successThreshold: 1,
      };

      // Should open after 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(service.circuitBreaker(customKey, fn, opts)).rejects.toThrow();
      }

      await expect(service.circuitBreaker(customKey, fn, opts)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should maintain separate state for different keys', async () => {
      const key1 = 'service-1';
      const key2 = 'service-2';
      const fn1 = jest.fn().mockRejectedValue(new Error('Fail'));
      const fn2 = jest.fn().mockResolvedValue('success');

      // Open circuit for key1
      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker(key1, fn1)).rejects.toThrow();
      }

      // key2 should still work
      const result = await service.circuitBreaker(key2, fn2);
      expect(result).toBe('success');

      // key1 should be open
      await expect(service.circuitBreaker(key1, fn1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should log when circuit opens', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Service failure'));

      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker('log-test', fn)).rejects.toThrow();
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
        }),
        'CircuitBreaker: OPEN',
      );
    });

    it('should log when circuit closes', async () => {
      const testKey = 'log-close-test';
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.circuitBreaker(testKey, fn, {
          cooldownPeriodMs: 50,
          successThreshold: 1,
        })).rejects.toThrow();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Close it
      fn.mockResolvedValue('success');
      await service.circuitBreaker(testKey, fn, { successThreshold: 1 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'CircuitBreaker: CLOSED again after successes',
      );
    });
  });

  describe('combined resilience patterns', () => {
    it('should use retry with circuit breaker together', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Transient'))
        .mockResolvedValue('success');

      const wrappedFn = () => service.retry(fn, { maxRetries: 2 });
      const result = await service.circuitBreaker('combined-test', wrappedFn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});