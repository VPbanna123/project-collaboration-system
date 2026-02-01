import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(clerkAuth);
router.use(requireAuth);

// Document routes
router.get('/:documentId', DocumentController.getDocumentById);
router.put('/:documentId', DocumentController.updateDocument);
router.delete('/:documentId', DocumentController.deleteDocument);
router.get('/:documentId/edits', DocumentController.getDocumentEdits);

export default router;
