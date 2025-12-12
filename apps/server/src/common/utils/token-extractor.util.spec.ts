import { Request } from 'express';
import { TokenExtractor } from './token-extractor.util';

describe('TokenExtractor', () => {
  describe('fromHeader', () => {
    it('should extract token from specified header', () => {
      const req = {
        headers: {
          'x-api-key': 'test-api-key-123',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromHeader(req, { hdrName: 'x-api-key' });

      expect(token).toBe('test-api-key-123');
    });

    it('should return null when header does not exist', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      const token = TokenExtractor.fromHeader(req, { hdrName: 'x-api-key' });

      expect(token).toBeNull();
    });

    it('should handle array of header values', () => {
      const req = {
        headers: {
          'x-custom-header': ['value1', 'value2'],
        },
      } as unknown as Request;

      const token = TokenExtractor.fromHeader(req, { hdrName: 'x-custom-header' });

      expect(token).toEqual(['value1', 'value2']);
    });

    it('should be case-sensitive for header names', () => {
      const req = {
        headers: {
          'x-api-key': 'lowercase-key',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromHeader(req, { hdrName: 'X-API-KEY' });

      expect(token).toBeNull();
    });

    it('should handle empty string header values', () => {
      const req = {
        headers: {
          'x-empty': '',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromHeader(req, { hdrName: 'x-empty' });

      expect(token).toBe('');
    });
  });

  describe('fromAuthHeaderWithScheme', () => {
    it('should extract token from Authorization header with Bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should be case-insensitive for scheme matching', () => {
      const req = {
        headers: {
          authorization: 'bearer token123',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'BEARER' });

      expect(token).toBe('token123');
    });

    it('should extract token with Basic scheme', () => {
      const req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Basic' });

      expect(token).toBe('YWRtaW46cGFzc3dvcmQ=');
    });

    it('should return null when Authorization header is missing', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBeNull();
    });

    it('should return null when scheme does not match', () => {
      const req = {
        headers: {
          authorization: 'Basic credentials',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBeNull();
    });

    it('should handle Authorization header with only scheme', () => {
      const req = {
        headers: {
          authorization: 'Bearer',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBeNull();
    });

    it('should extract token with custom scheme', () => {
      const req = {
        headers: {
          authorization: 'Custom my-custom-token-value',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Custom' });

      expect(token).toBe('my-custom-token-value');
    });

    it('should handle Authorization header with extra whitespace', () => {
      const req = {
        headers: {
          authorization: 'Bearer   token-with-spaces',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderWithScheme(req, { scheme: 'Bearer' });

      expect(token).toBe('token-with-spaces');
    });
  });

  describe('fromAuthHeaderAsBearerToken', () => {
    it('should extract Bearer token using convenience method', () => {
      const req = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderAsBearerToken(req);

      expect(token).toBe('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0');
    });

    it('should return null for non-Bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'Basic credentials',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderAsBearerToken(req);

      expect(token).toBeNull();
    });

    it('should return null when Authorization header is missing', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderAsBearerToken(req);

      expect(token).toBeNull();
    });

    it('should handle lowercase bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'bearer my-token',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromAuthHeaderAsBearerToken(req);

      expect(token).toBe('my-token');
    });
  });

  describe('fromCookies', () => {
    it('should extract token from signed cookies', () => {
      const req = {
        signedCookies: {
          sessionToken: 'signed-session-token-abc123',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: 'sessionToken' });

      expect(token).toBe('signed-session-token-abc123');
    });

    it('should return null when cookie does not exist', () => {
      const req = {
        signedCookies: {},
      } as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: 'sessionToken' });

      expect(token).toBeNull();
    });

    it('should return null when signedCookies is undefined', () => {
      const req = {} as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: 'sessionToken' });

      expect(token).toBeNull();
    });

    it('should extract token with special cookie name', () => {
      const req = {
        signedCookies: {
          '__Host-sid': 'secure-host-session-id',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: '__Host-sid' });

      expect(token).toBe('secure-host-session-id');
    });

    it('should handle empty cookie value', () => {
      const req = {
        signedCookies: {
          emptyToken: '',
        },
      } as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: 'emptyToken' });

      expect(token).toBe('');
    });

    it('should not extract from unsigned cookies', () => {
      const req = {
        cookies: {
          unsignedToken: 'some-value',
        },
        signedCookies: {},
      } as unknown as Request;

      const token = TokenExtractor.fromCookies(req, { cookieName: 'unsignedToken' });

      expect(token).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle request with multiple token sources', () => {
      const req = {
        headers: {
          authorization: 'Bearer header-token',
          'x-api-key': 'api-key-token',
        },
        signedCookies: {
          sessionToken: 'cookie-token',
        },
      } as unknown as Request;

      expect(TokenExtractor.fromAuthHeaderAsBearerToken(req)).toBe('header-token');
      expect(TokenExtractor.fromHeader(req, { hdrName: 'x-api-key' })).toBe('api-key-token');
      expect(TokenExtractor.fromCookies(req, { cookieName: 'sessionToken' })).toBe('cookie-token');
    });

    it('should prioritize fallback when primary source is missing', () => {
      const req = {
        headers: {},
        signedCookies: {
          sessionToken: 'fallback-token',
        },
      } as unknown as Request;

      const headerToken = TokenExtractor.fromAuthHeaderAsBearerToken(req);
      const cookieToken = TokenExtractor.fromCookies(req, { cookieName: 'sessionToken' });

      expect(headerToken).toBeNull();
      expect(cookieToken).toBe('fallback-token');
    });
  });
});