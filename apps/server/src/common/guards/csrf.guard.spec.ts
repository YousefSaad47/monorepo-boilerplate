import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;
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

  describe('with default options', () => {
    beforeEach(() => {
      guard = new CsrfGuard(mockReflector, {});
    });

    it('should allow safe methods (GET, HEAD)', () => {
      const req = {
        method: 'GET',
        headers: {},
        header: jest.fn(),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow HEAD requests', () => {
      const req = {
        method: 'HEAD',
        headers: {},
        header: jest.fn(),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should block POST without proper headers', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should allow POST with same-origin sec-fetch-site', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn((name: string) => {
          if (name === 'sec-fetch-site') return 'same-origin';
          if (name === 'content-type') return 'application/x-www-form-urlencoded';
          return undefined;
        }),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow POST with matching origin header', () => {
      const req = {
        method: 'POST',
        headers: {
          origin: 'https://example.com',
        },
        header: jest.fn((name: string) => {
          if (name === 'content-type') return 'application/x-www-form-urlencoded';
          return undefined;
        }),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow JSON content-type (not form-based)', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('application/json'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('with SkipCsrf decorator', () => {
    beforeEach(() => {
      guard = new CsrfGuard(mockReflector, {});
    });

    it('should skip CSRF check when decorator is present', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(true);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('with custom origin configuration', () => {
    it('should allow specified origin string', () => {
      guard = new CsrfGuard(mockReflector, {
        origin: 'https://trusted.com',
      });

      const req = {
        method: 'POST',
        headers: {
          origin: 'https://trusted.com',
        },
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should reject non-matching origin', () => {
      guard = new CsrfGuard(mockReflector, {
        origin: 'https://trusted.com',
      });

      const req = {
        method: 'POST',
        headers: {
          origin: 'https://untrusted.com',
        },
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should allow origins from array', () => {
      guard = new CsrfGuard(mockReflector, {
        origin: ['https://trusted1.com', 'https://trusted2.com'],
      });

      const req = {
        method: 'POST',
        headers: {
          origin: 'https://trusted2.com',
        },
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should use custom origin validation function', () => {
      guard = new CsrfGuard(mockReflector, {
        origin: (origin, req) => origin.endsWith('.example.com'),
      });

      const req = {
        method: 'POST',
        headers: {
          origin: 'https://subdomain.example.com',
        },
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('with custom secFetchSite configuration', () => {
    it('should allow specified sec-fetch-site value', () => {
      guard = new CsrfGuard(mockReflector, {
        secFetchSite: 'same-site',
      });

      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn((name: string) => {
          if (name === 'sec-fetch-site') return 'same-site';
          if (name === 'content-type') return 'application/x-www-form-urlencoded';
          return undefined;
        }),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow multiple sec-fetch-site values from array', () => {
      guard = new CsrfGuard(mockReflector, {
        secFetchSite: ['same-origin', 'same-site'],
      });

      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn((name: string) => {
          if (name === 'sec-fetch-site') return 'same-site';
          if (name === 'content-type') return 'application/x-www-form-urlencoded';
          return undefined;
        }),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should use custom secFetchSite validation function', () => {
      guard = new CsrfGuard(mockReflector, {
        secFetchSite: (value) => value !== 'cross-site',
      });

      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn((name: string) => {
          if (name === 'sec-fetch-site') return 'same-origin';
          if (name === 'content-type') return 'application/x-www-form-urlencoded';
          return undefined;
        }),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('form-based content types', () => {
    beforeEach(() => {
      guard = new CsrfGuard(mockReflector, {});
    });

    it('should check CSRF for application/x-www-form-urlencoded', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should check CSRF for multipart/form-data', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('multipart/form-data; boundary=----WebKitFormBoundary'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should check CSRF for text/plain', () => {
      const req = {
        method: 'POST',
        headers: {},
        header: jest.fn().mockReturnValue('text/plain'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('PUT and DELETE methods', () => {
    beforeEach(() => {
      guard = new CsrfGuard(mockReflector, {});
    });

    it('should apply CSRF check to PUT requests', () => {
      const req = {
        method: 'PUT',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should apply CSRF check to DELETE requests', () => {
      const req = {
        method: 'DELETE',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should apply CSRF check to PATCH requests', () => {
      const req = {
        method: 'PATCH',
        headers: {},
        header: jest.fn().mockReturnValue('application/x-www-form-urlencoded'),
      } as unknown as Request;

      const ctx = createMockContext(req);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});