import { Request } from 'express';
import { getClientIp, getGeoData } from './ip.util';

describe('ip.util', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should extract IPv6 from x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle IPv4 with port in x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1:8080, 10.0.0.1',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should return null for invalid IPs in x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': 'invalid, not-an-ip',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBeNull();
    });

    it('should throw TypeError for non-string x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': 123 as any,
        },
        socket: {},
      } as unknown as Request;

      expect(() => getClientIp(req)).toThrow(TypeError);
      expect(() => getClientIp(req)).toThrow('Expected a string, got "number"');
    });

    it('should extract IP from x-client-ip header', () => {
      const req = {
        headers: {
          'x-client-ip': '192.168.1.100',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.100');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const req = {
        headers: {
          'cf-connecting-ip': '203.0.113.45',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.45');
    });

    it('should extract IP from true-client-ip header', () => {
      const req = {
        headers: {
          'true-client-ip': '198.51.100.42',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('198.51.100.42');
    });

    it('should extract IP from x-real-ip header', () => {
      const req = {
        headers: {
          'x-real-ip': '203.0.113.89',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.89');
    });

    it('should prioritize x-forwarded-for over other headers', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-client-ip': '203.0.113.2',
          'x-real-ip': '203.0.113.3',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('should fallback to socket.remoteAddress', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '192.168.1.50',
        },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.50');
    });

    it('should return null when no IP is available', () => {
      const req = {
        headers: {},
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBeNull();
    });

    it('should handle empty x-forwarded-for', () => {
      const req = {
        headers: {
          'x-forwarded-for': '',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBeNull();
    });

    it('should handle request without headers', () => {
      const req = {
        socket: {
          remoteAddress: '10.0.0.1',
        },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('10.0.0.1');
    });

    it('should validate IPv4 format strictly', () => {
      const req = {
        headers: {
          'x-forwarded-for': '256.256.256.256',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBeNull();
    });

    it('should handle x-appengine-user-ip header', () => {
      const req = {
        headers: {
          'x-appengine-user-ip': '203.0.113.22',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('203.0.113.22');
    });

    it('should skip invalid headers and continue searching', () => {
      const req = {
        headers: {
          'x-client-ip': 'invalid-ip',
          'x-real-ip': '192.168.1.1',
        },
        socket: {},
      } as unknown as Request;

      expect(getClientIp(req)).toBe('192.168.1.1');
    });
  });

  describe('getGeoData', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch and return geo data for valid IP', async () => {
      const mockResponse = {
        city: 'New York',
        regionName: 'New York',
        countryCode: 'US',
        status: 'success',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await getGeoData('8.8.8.8');

      expect(fetch).toHaveBeenCalledWith('http://ip-api.com/json/8.8.8.8');
      expect(result).toEqual({
        city: 'New York',
        region: 'New York',
        countryCode: 'US',
      });
    });

    it('should return null on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getGeoData('8.8.8.8');

      expect(result).toBeNull();
    });

    it('should return null on invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await getGeoData('8.8.8.8');

      expect(result).toBeNull();
    });

    it('should handle IPv6 addresses', async () => {
      const mockResponse = {
        city: 'London',
        regionName: 'England',
        countryCode: 'GB',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await getGeoData('2001:4860:4860::8888');

      expect(fetch).toHaveBeenCalledWith('http://ip-api.com/json/2001:4860:4860::8888');
      expect(result).toEqual({
        city: 'London',
        region: 'England',
        countryCode: 'GB',
      });
    });

    it('should handle missing fields in response', async () => {
      const mockResponse = {
        city: undefined,
        regionName: null,
        countryCode: 'US',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await getGeoData('1.1.1.1');

      expect(result).toEqual({
        city: undefined,
        region: null,
        countryCode: 'US',
      });
    });
  });
});