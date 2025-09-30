import jwt from 'jsonwebtoken';
const { JsonWebTokenError, TokenExpiredError } = jwt;
import { AppError } from '../middleware/errorHandler.js';

// JWT payload interfaces
export interface UserTokenPayload {
  userId: string;
  type: 'user';
  iat?: number;
  exp?: number;
}

export interface AdminTokenPayload {
  userId: string;
  type: 'admin';
  role: 'admin' | 'manager';
  iat?: number;
  exp?: number;
}

export type TokenPayload = UserTokenPayload | AdminTokenPayload;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate JWT token for user authentication
 */
export const generateUserToken = (userId: string): string => {
  const payload: UserTokenPayload = {
    userId,
    type: 'user',
  };

  return (jwt.sign as any)(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'voter-management-system',
    audience: 'voter-portal',
  });
};

/**
 * Generate JWT token for admin authentication
 */
export const generateAdminToken = (
  userId: string,
  role: 'admin' | 'manager'
): string => {
  const payload: AdminTokenPayload = {
    userId,
    type: 'admin',
    role,
  };

  return (jwt.sign as any)(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'voter-management-system',
    audience: 'admin-portal',
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
  userId: string,
  type: 'user' | 'admin'
): string => {
  const payload = {
    userId,
    type,
    tokenType: 'refresh',
  };

  return (jwt.sign as any)(payload, JWT_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'voter-management-system',
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    } else if (error instanceof JsonWebTokenError) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    } else {
      throw new AppError(
        'Token verification failed',
        401,
        'TOKEN_VERIFICATION_FAILED'
      );
    }
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string => {
  if (!authHeader) {
    throw new AppError(
      'Authorization header is required',
      401,
      'MISSING_AUTH_HEADER'
    );
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(
      'Invalid authorization header format',
      401,
      'INVALID_AUTH_HEADER'
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new AppError('Token is required', 401, 'MISSING_TOKEN');
  }

  return token;
};

/**
 * Check if token is about to expire (within 1 hour)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return false;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    return expirationTime - currentTime < oneHour;
  } catch {
    return false;
  }
};
