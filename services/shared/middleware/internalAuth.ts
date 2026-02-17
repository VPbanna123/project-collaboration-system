/**
 * Internal Auth Middleware
 * Used by all microservices to verify internal JWT from API Gateway
 * NO Clerk dependency - just verifies internal token
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET || 'your-internal-secret-change-in-production';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
}

// Extend Express Request to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware: Verify internal JWT from API Gateway
 * NO CLERK VERIFICATION - Gateway already did it!
 */
export async function verifyInternalToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get internal token from header (set by API Gateway)
    const internalToken = req.headers['x-internal-token'] as string;

    if (!internalToken) {
      return res.status(401).json({ 
        error: 'Unauthorized - No internal token. Did you go through API Gateway?' 
      });
    }

    // Verify internal JWT (fast, local verification)
    const decoded = jwt.verify(internalToken, INTERNAL_JWT_SECRET) as { userId: string; clerkId: string; email: string; name?: string };

    // Attach user to request (map userId from JWT to id in user object)
    req.user = {
      id: decoded.userId,
      clerkId: decoded.clerkId,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error('Internal token verification failed:', error);
    res.status(401).json({ error: 'Invalid internal token' });
  }
}

/**
 * Alternative: Trust headers from Gateway (even simpler, less secure)
 */
export function trustGatewayHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;

  if (!userId || !email) {
    return res.status(401).json({ 
      error: 'Unauthorized - Missing user headers from gateway' 
    });
  }

  req.user = {
    id: userId,
    clerkId: req.headers['x-clerk-id'] as string || '',
    email,
    name: req.headers['x-user-name'] as string,
  };

  next();
}

export const internalAuth = {
  verifyInternalToken,
  trustGatewayHeaders,
};

export default internalAuth;
