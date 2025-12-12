import { RequestIdMiddleware } from './request-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('with default options', () => {
    it('should generate and set request ID', () => {
      const MiddlewareClass = RequestIdMiddleware();
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBeDefined();
      expect(typeof mockReq.id).toBe('string');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', mockReq.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing request ID from header', () => {
      const existingId = 'existing-request-id-123';
      mockReq.headers = {
        'X-Request-Id': existingId,
      };

      const MiddlewareClass = RequestIdMiddleware();
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe(existingId);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', existingId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate unique IDs for different requests', () => {
      const MiddlewareClass = RequestIdMiddleware();
      const middleware = new MiddlewareClass();

      const mockReq1 = { headers: {} } as Request;
      const mockReq2 = { headers: {} } as Request;
      const mockRes1 = { setHeader: jest.fn() } as unknown as Response;
      const mockRes2 = { setHeader: jest.fn() } as unknown as Response;

      middleware.use(mockReq1, mockRes1, mockNext);
      middleware.use(mockReq2, mockRes2, mockNext);

      expect(mockReq1.id).not.toBe(mockReq2.id);
      expect(mockReq1.id).toBeDefined();
      expect(mockReq2.id).toBeDefined();
    });
  });

  describe('with custom header name', () => {
    it('should use custom header name', () => {
      const customHeader = 'X-Correlation-Id';
      const MiddlewareClass = RequestIdMiddleware({ headerName: customHeader });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBeDefined();
      expect(mockRes.setHeader).toHaveBeenCalledWith(customHeader, mockReq.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should read from custom header name', () => {
      const customHeader = 'X-Trace-Id';
      const existingId = 'trace-id-789';
      mockReq.headers = {
        [customHeader]: existingId,
      };

      const MiddlewareClass = RequestIdMiddleware({ headerName: customHeader });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe(existingId);
      expect(mockRes.setHeader).toHaveBeenCalledWith(customHeader, existingId);
    });
  });

  describe('with custom generator', () => {
    it('should use custom ID generator function', () => {
      const customGenerator = jest.fn(() => 'custom-id-12345');
      const MiddlewareClass = RequestIdMiddleware({ generator: customGenerator });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(customGenerator).toHaveBeenCalled();
      expect(mockReq.id).toBe('custom-id-12345');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', 'custom-id-12345');
    });

    it('should not use generator when ID exists in header', () => {
      const customGenerator = jest.fn(() => 'should-not-be-called');
      mockReq.headers = {
        'X-Request-Id': 'existing-id',
      };

      const MiddlewareClass = RequestIdMiddleware({ generator: customGenerator });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(customGenerator).not.toHaveBeenCalled();
      expect(mockReq.id).toBe('existing-id');
    });

    it('should support sequential ID generation', () => {
      let counter = 0;
      const sequentialGenerator = () => `request-${++counter}`;
      const MiddlewareClass = RequestIdMiddleware({ generator: sequentialGenerator });
      const middleware = new MiddlewareClass();

      const mockReq1 = { headers: {} } as Request;
      const mockReq2 = { headers: {} } as Request;
      const mockRes1 = { setHeader: jest.fn() } as unknown as Response;
      const mockRes2 = { setHeader: jest.fn() } as unknown as Response;

      middleware.use(mockReq1, mockRes1, mockNext);
      middleware.use(mockReq2, mockRes2, mockNext);

      expect(mockReq1.id).toBe('request-1');
      expect(mockReq2.id).toBe('request-2');
    });
  });

  describe('edge cases', () => {
    it('should handle case-insensitive header names', () => {
      const existingId = 'case-test-id';
      mockReq.headers = {
        'x-request-id': existingId,
      };

      const MiddlewareClass = RequestIdMiddleware({ headerName: 'X-Request-Id' });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe(existingId);
    });

    it('should handle empty string header value', () => {
      mockReq.headers = {
        'X-Request-Id': '',
      };

      const MiddlewareClass = RequestIdMiddleware();
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      // Should generate new ID since empty string is falsy
      expect(mockReq.id).toBeDefined();
      expect(mockReq.id).not.toBe('');
    });

    it('should always call next()', () => {
      const MiddlewareClass = RequestIdMiddleware();
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('integration scenarios', () => {
    it('should work with distributed tracing', () => {
      const traceId = 'trace-abc-123';
      mockReq.headers = {
        'X-Trace-Id': traceId,
      };

      const MiddlewareClass = RequestIdMiddleware({ headerName: 'X-Trace-Id' });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe(traceId);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Trace-Id', traceId);
    });

    it('should support microservice correlation', () => {
      const correlationId = 'correlation-xyz-789';
      mockReq.headers = {
        'X-Correlation-Id': correlationId,
      };

      const MiddlewareClass = RequestIdMiddleware({ headerName: 'X-Correlation-Id' });
      const middleware = new MiddlewareClass();

      middleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe(correlationId);
    });
  });
});