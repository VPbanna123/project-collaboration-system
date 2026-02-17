/**
 * API Gateway - Centralized Authentication
 * Only this gateway verifies Clerk tokens
 * Other services receive pre-verified user info
 */

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Secret for internal JWT (shared with all services)
const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET || 'your-internal-secret-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Extend Express Request to include user
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      clerkId: string;
      email: string;
      name?: string;
    };
  }
}

// Clerk JWT Payload type
interface ClerkJWTPayload {
  sub: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Middleware: Verify Clerk token and issue internal token
 * Uses @clerk/backend for lightweight JWT verification
 */
async function verifyClerkAndIssueInternalToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Get Clerk token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const clerkToken = authHeader.substring(7);

    // 2. Verify with Clerk using lightweight verification (no heavy SDK!)
    // This uses JWKS and is much faster than the full SDK
    const payload = await verifyToken(clerkToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    }) as ClerkJWTPayload;

    if (!payload || !payload.sub) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // 3. Get user from user-service (with internal call)
    // Special case: For POST /api/users/sync, allow user creation without database lookup
    let user;
    const isUserSync = req.method === 'POST' && 
                       (req.originalUrl.includes('/api/users/sync') || req.path.includes('/sync'));
    
    console.log('[Gateway Auth] Method:', req.method, 'Path:', req.path, 'OriginalUrl:', req.originalUrl, 'IsUserSync:', isUserSync);
    
    if (isUserSync) {
      // For user sync endpoint, create a minimal user object from Clerk token
      // The actual user will be created/updated by the sync endpoint
      console.log('[Gateway Auth] Bypassing user lookup for sync endpoint');
      user = {
        id: payload.sub, // Use Clerk ID temporarily
        clerkId: payload.sub,
        email: payload.email || req.body.email || 'unknown@clerk.generated',
        name: req.body.name || 'Unknown User',
      };
    } else {
      // For all other endpoints, look up the user in the database
      console.log('[Gateway Auth] Looking up user in database for Clerk ID:', payload.sub);
      try {
        const userResponse = await axios.get(
          `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/api/users/clerk/${payload.sub}`,
          {
            headers: {
              'x-internal-api-key': process.env.INTERNAL_API_KEY,
            },
          }
        );
        user = userResponse.data.data || userResponse.data;
        console.log('[Gateway Auth] User found:', user.id);
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
        console.error('[Gateway Auth] Failed to fetch user:', errorMessage);
        console.error('[Gateway Auth] User lookup URL:', `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/api/users/clerk/${payload.sub}`);
        res.status(401).json({ error: 'User not found' });
        return;
      }
    }

    // 4. Create internal JWT with user info
    const internalToken = jwt.sign(
      {
        userId: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
      },
      INTERNAL_JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Attach user and tokens to request
    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
    };

    // Set headers for downstream services
    req.headers['x-internal-token'] = internalToken;
    req.headers['x-internal-api-key'] = process.env.INTERNAL_API_KEY;
    req.headers['x-user-id'] = user.id;
    req.headers['x-user-email'] = user.email;

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token', details: errorMessage });
    return;
  }
}

/**
 * Route all requests to appropriate service
 */

// User routes → User Service
app.use('/api/users', verifyClerkAndIssueInternalToken, (req: Request, res: Response) => {
  proxyToService('users', req, res);
});

// Team routes → Team Service
app.use('/api/teams', verifyClerkAndIssueInternalToken, (req: Request, res: Response) => {
  proxyToService('teams', req, res);
});

// Project routes → Project Service
app.use('/api/projects', verifyClerkAndIssueInternalToken, (req: Request, res: Response) => {
  proxyToService('projects', req, res);
});

// Chat routes → Chat Service
app.use('/api/chat', verifyClerkAndIssueInternalToken, (req: Request, res: Response) => {
  proxyToService('chat', req, res);
});

// Notification routes → Notification Service
app.use('/api/notifications', verifyClerkAndIssueInternalToken, (req: Request, res: Response) => {
  proxyToService('notifications', req, res);
});

/**
 * Proxy request to service
 */
async function proxyToService(
  serviceName: string,
  req: Request,
  res: Response
): Promise<void> {
  try {
    const serviceUrls: Record<string, string> = {
      'users': process.env.USER_SERVICE_URL || 'http://localhost:3001',
      'teams': process.env.TEAM_SERVICE_URL || 'http://localhost:3002',
      'projects': process.env.PROJECT_SERVICE_URL || 'http://localhost:3003',
      'chat': process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
      'notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    };

    const serviceUrl = serviceUrls[serviceName];
    if (!serviceUrl) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Parse URL to separate path and query string
    const urlObj = new URL(req.originalUrl, 'http://localhost');
    const pathWithoutQuery = urlObj.pathname.replace(`/api/${serviceName}`, '');
    const fullUrl = `${serviceUrl}/api/${serviceName}${pathWithoutQuery}`;

    console.log(`[Gateway] Proxying ${req.method} ${req.originalUrl} → ${fullUrl}`);

    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      params: req.query,
      headers: {
        'x-internal-token': req.headers['x-internal-token'] as string,
        'x-internal-api-key': req.headers['x-internal-api-key'] as string,
        'x-user-id': req.headers['x-user-id'] as string,
        'x-user-email': req.headers['x-user-email'] as string,
        'content-type': req.headers['content-type'] || 'application/json',
      },
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    const error = err as Error;
    const errorMessage = error.message || 'Unknown error';
    const statusCode = axios.isAxiosError(err) ? err.response?.status || 500 : 500;
    const errorData = axios.isAxiosError(err) ? err.response?.data : 'Service error';
    
    console.error(`[Gateway] Error proxying to ${serviceName}:`, errorMessage);
    res.status(statusCode).json({
      error: errorData,
      message: errorMessage,
    });
  }
}

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`✅ Clerk authentication enabled`);
  console.log(`📡 Proxying to microservices...`);
});

export default app;
