import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Extend Express Request to include userId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify Clerk JWT token
 */
export const clerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized - No token provided', 401);
    }

    const token = authHeader.substring(7);
    
    // Verify Clerk session token
    // In production, verify with Clerk's backend API
    // For now, we'll decode the JWT
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecretKey) {
      throw new AppError('Server configuration error', 500);
    }

    // TODO: Properly verify Clerk JWT token
    // For now, extract userId from token (you should use @clerk/backend)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      
      req.userId = payload.sub;
      next();
    } catch (err) {
      throw new AppError('Invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Require authentication - throws error if not authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    throw new AppError('Unauthorized', 401);
  }
  next();
};
