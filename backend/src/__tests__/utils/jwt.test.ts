import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateUserToken,
  generateAdminToken,
  verifyToken,
} from '../../utils/jwt';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {},
    TokenExpiredError: class TokenExpiredError extends Error {},
  },
}));

describe('JWT Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUserToken', () => {
    it('should generate user token with correct payload', async () => {
      const jwt = await import('jsonwebtoken');
      const mockToken = 'generated-token';
      jwt.default.sign = vi.fn().mockReturnValue(mockToken);

      const result = generateUserToken('123');

      expect(jwt.default.sign).toHaveBeenCalledWith(
        {
          userId: '123',
          type: 'user',
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '24h',
          issuer: 'voter-management-system',
          audience: 'voter-portal',
        }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('generateAdminToken', () => {
    it('should generate admin token with role', async () => {
      const jwt = await import('jsonwebtoken');
      const mockToken = 'admin-token';
      jwt.default.sign = vi.fn().mockReturnValue(mockToken);

      const result = generateAdminToken('123', 'admin');

      expect(jwt.default.sign).toHaveBeenCalledWith(
        {
          userId: '123',
          type: 'admin',
          role: 'admin',
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '24h',
          issuer: 'voter-management-system',
          audience: 'admin-portal',
        }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const jwt = await import('jsonwebtoken');
      const mockPayload = {
        userId: '123',
        type: 'user',
      };

      jwt.default.verify = vi.fn().mockReturnValue(mockPayload);

      const result = verifyToken('valid-token');

      expect(jwt.default.verify).toHaveBeenCalledWith(
        'valid-token',
        process.env.JWT_SECRET
      );
      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid token', async () => {
      const jwt = await import('jsonwebtoken');
      jwt.default.verify = vi.fn().mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() => verifyToken('invalid-token')).toThrow(
        'Token verification failed'
      );
    });
  });
});
