import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// Internal endpoint for service-to-service communication (no auth required)
// This should be protected by network security in production
router.post('/internal/send', NotificationController.sendNotification);

// Protected endpoints for user-facing requests
router.use(clerkAuth);
router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread', NotificationController.getUnreadCount);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.post('/send', NotificationController.sendNotification);

export default router;
