import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// Internal endpoint for service-to-service communication (no auth required)
// This should be protected by network security in production
router.get('/internal/search', UserController.searchUsers);

// Sync endpoints - no auth required since they're creating/syncing users
// These are called during initial user creation when auth might not be fully set up
router.post('/sync', UserController.syncUserFromFrontend);
router.get('/sync', UserController.syncUser);

// All other routes require authentication
router.use(clerkAuth);

// Get current user profile
router.get('/profile', requireAuth, UserController.getProfile);

// Update current user profile
router.put('/profile', requireAuth, UserController.updateProfile);

// Get user by ID
router.get('/:id', requireAuth, UserController.getUserById);

// Search users
router.get('/search', requireAuth, UserController.searchUsers);

export default router;
