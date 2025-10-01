import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth';

// Mock jwt utils
vi.mock('../../utils/jwt', () => ({
  verifyToken: vi.fn(),
  extractTokenFromHeader: vi.fn(),
}));

// Mock security audit service
vi.mock('../../services/securityAuditService', () => ({
  securityAudit: {
    logAuthenticationEvent: vi.fn(),
  },
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate valid user token from Authorization header', async () => {
      const { verifyToken, extractTokenFromHeader } = await import(
        '../../utils/jwt'
      );
      const mockPayload = {
        userId: '123',
        type: 'user',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token');
      vi.mocked(verifyToken).mockReturnValue(mockPayload as any);

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error if no token provided', async () => {
      const { extractTokenFromHeader } = await import('../../utils/jwt');

      // Mock extractTokenFromHeader to throw an error when no token is provided
      vi.mocked(extractTokenFromHeader).mockImplementation(() => {
        throw new Error('Authorization header is required');
      });

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
