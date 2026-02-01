import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { UserService } from '../services/userService';
import { asyncHandler } from '@shared/middleware/errorHandler';

export class WebhookController {
  /**
   * POST /api/webhook/clerk
   * Handle Clerk webhook events
   */
  static handleClerkWebhook = asyncHandler(async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured');
    }

    // Get Svix headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Verify webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: { type: string; data: { id: string } };

    try {
      evt = wh.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as { type: string; data: { id: string } };
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Handle events
    const eventType = evt.type;
    const { id } = evt.data;

    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        await UserService.syncUser(id);
        break;

      case 'user.deleted':
        await UserService.deleteUser(id);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.json({ success: true });
  });
}
