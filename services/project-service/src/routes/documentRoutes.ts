import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// All routes require authentication from API Gateway
router.use(verifyInternalToken);

// Document routes
router.get('/:documentId', DocumentController.getDocumentById);
router.put('/:documentId', DocumentController.updateDocument);
router.delete('/:documentId', DocumentController.deleteDocument);
router.get('/:documentId/edits', DocumentController.getDocumentEdits);

export default router;
