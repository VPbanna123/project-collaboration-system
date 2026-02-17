import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// Internal endpoint for service-to-service communication (no auth required)
// This should be protected by network security in production
router.get('/internal/search', UserController.searchUsers);

// Internal endpoint for API Gateway to look up user by Clerk ID
router.get('/clerk/:clerkId', UserController.getUserByClerkIdRoute);

// Sync endpoints - no auth required since they're creating/syncing users
// These are called during initial user creation when auth might not be fully set up
router.post('/sync', UserController.syncUserFromFrontend);
router.get('/sync', UserController.syncUser);

// All other routes require authentication from API Gateway
router.use(verifyInternalToken);

// Get current user profile
router.get('/profile', UserController.getProfile);

// Update current user profile
router.put('/profile', UserController.updateProfile);

// Get user by ID
router.get('/:id', UserController.getUserById);

// Search users
router.get('/search', UserController.searchUsers);

export default router;
