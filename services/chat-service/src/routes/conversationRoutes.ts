import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(clerkAuth);
router.use(requireAuth);

// Get all conversations for the current user
router.get('/', ConversationController.getUserConversations);

// Get unread message count
router.get('/unread', ConversationController.getUnreadCount);

// Get or create conversation with a user
router.post('/start', ConversationController.startConversation);

// Get messages in a conversation
router.get('/:conversationId/messages', ConversationController.getMessages);

// Send a message
router.post('/:conversationId/messages', ConversationController.sendMessage);

// Mark messages as read
router.post('/:conversationId/read', ConversationController.markAsRead);

// Delete conversation
router.delete('/:conversationId', ConversationController.deleteConversation);

export default router;
