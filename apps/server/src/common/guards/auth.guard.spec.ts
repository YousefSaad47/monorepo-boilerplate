import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new AuthGuard(mockReflector);
  });

  const createMockContext = (req: Partial<Request>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('Public routes', () => {
    it('should allow access to public routes', () => {
      const req = {} as Request;
      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('Protected routes', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should allow access with valid cookies', () => {
      const req = {
        signedCookies: {
          '__Host-sid': 'session-id-123',
          '__Host-hsid': 'hash-session-id-456',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('should allow access with Bearer token and hsid cookie', () => {
      const req = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        },
        signedCookies: {
          '__Host-hsid': 'hash-session-id-456',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('should deny access when sid cookie is missing', () => {
      const req = {
        signedCookies: {
          '__Host-hsid': 'hash-session-id-456',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('should deny access when hsid cookie is missing', () => {
      const req = {
        signedCookies: {
          '__Host-sid': 'session-id-123',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('should deny access when both cookies are missing', () => {
      const req = {
        signedCookies: {},
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('should deny access when Bearer token is invalid format', () => {
      const req = {
        headers: {
          authorization: 'Invalid token-format',
        },
        signedCookies: {
          '__Host-hsid': 'hash-session-id-456',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('should deny access when no authentication is provided', () => {
      const req = {
        headers: {},
        signedCookies: {},
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('should handle missing signedCookies object', () => {
      const req = {
        headers: {
          authorization: 'Bearer token123',
        },
      } as unknown as Request;

      const ctx = createMockContext(req);
      const result = guard.canActivate(ctx);

      expect(result).toBe(false);
    });
  });
});