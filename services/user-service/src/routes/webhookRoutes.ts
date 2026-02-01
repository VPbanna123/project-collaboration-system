import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

// Clerk webhook (no auth required)
router.post('/clerk', WebhookController.handleClerkWebhook);

export default router;
