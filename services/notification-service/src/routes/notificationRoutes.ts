import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// Internal endpoint for service-to-service communication (no auth required)
// This should be protected by network security in production
router.post('/internal/send', NotificationController.sendNotification);

// Protected endpoints for user-facing requests (via API Gateway)
router.use(verifyInternalToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread', NotificationController.getUnreadCount);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.post('/send', NotificationController.sendNotification);

export default router;
