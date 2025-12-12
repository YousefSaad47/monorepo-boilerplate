import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';

describe('ThrottlerBehindProxyGuard', () => {
  let guard: ThrottlerBehindProxyGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new ThrottlerBehindProxyGuard(
      { ttl: 60000, limit: 10, ignoreUserAgents: [], skipIf: () => false } as any,
      {} as any,
      mockReflector,
    );
  });

  describe('getTracker', () => {
    it('should extract IP from getClientIp utility', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195',
        },
        socket: {},
        ips: [],
        ip: '127.0.0.1',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('203.0.113.195');
    });

    it('should fallback to first IP in ips array', async () => {
      const req = {
        headers: {},
        socket: {},
        ips: ['192.168.1.1', '10.0.0.1'],
        ip: '127.0.0.1',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('192.168.1.1');
    });

    it('should fallback to req.ip when no other sources available', async () => {
      const req = {
        headers: {},
        socket: {},
        ips: [],
        ip: '203.0.113.50',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('203.0.113.50');
    });

    it('should handle missing IP gracefully', async () => {
      const req = {
        headers: {},
        socket: {},
        ips: [],
        ip: undefined,
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBeUndefined();
    });

    it('should prioritize x-forwarded-for over other sources', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.100',
        },
        socket: {
          remoteAddress: '192.168.1.1',
        },
        ips: ['10.0.0.1'],
        ip: '127.0.0.1',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('203.0.113.100');
    });

    it('should handle IPv6 addresses', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3::8a2e:0370:7334',
        },
        socket: {},
        ips: [],
        ip: '127.0.0.1',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });

    it('should handle Cloudflare CF-Connecting-IP header', async () => {
      const req = {
        headers: {
          'cf-connecting-ip': '203.0.113.25',
        },
        socket: {},
        ips: [],
        ip: '172.16.0.1',
      } as unknown as Request;

      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe('203.0.113.25');
    });
  });
});