import { Router, Request, Response } from 'express';
import { verifyInternalToken } from '@shared/middleware/internalAuth';
import axios from 'axios';

const router = Router();

// All routes require authentication from API Gateway
router.use(verifyInternalToken);

// Search users for starting conversations
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user?.id;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Forward to user service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    const response = await axios.get(`${userServiceUrl}/api/users/search`, {
      params: { q, limit, excludeUserId: userId },
      headers: {
        'x-internal-token': req.headers['x-internal-token'] as string,
        'x-internal-api-key': req.headers['x-internal-api-key'] as string,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error('[Chat Service] Error searching users:', err);
    const error = err as any;
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
