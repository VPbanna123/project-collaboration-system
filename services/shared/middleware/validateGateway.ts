/**
 * Internal Gateway Validation Middleware
 * 
 * Validates that requests are coming from the API Gateway
 * by checking the x-internal-api-key header.
 * 
 * This is a SECONDARY security layer. PRIMARY protection is network isolation.
 * 
 * Usage in service routes:
 * ```typescript
 * import { validateGateway } from '@shared/middleware/validateGateway';
 * 
 * router.get('/users', validateGateway, getUsersController);
 * ```
 */

import { Request, Response, NextFunction } from 'express';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!INTERNAL_API_KEY) {
  console.warn('⚠️  INTERNAL_API_KEY not set. Gateway validation will fail!');
}

/**
 * Middleware to validate requests from API Gateway
 * 
 * Checks for x-internal-api-key header matching the configured secret.
 * This prevents unauthorized services from calling internal APIs.
 */
export const validateGateway = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-internal-api-key'];

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing internal API key. Requests must come through API Gateway.',
    });
    return;
  }

  if (apiKey !== INTERNAL_API_KEY) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid internal API key.',
    });
    return;
  }

  // Valid gateway request
  next();
};

/**
 * Optional middleware for internal health checks
 * Allows health endpoints to bypass gateway validation
 */
export const allowHealthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path === '/health' || req.path === '/healthz') {
    next();
    return;
  }

  validateGateway(req, res, next);
};
