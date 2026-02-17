import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { DocumentController } from '../controllers/documentController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// All routes require authentication from API Gateway
router.use(verifyInternalToken);

// Project routes
router.get('/', ProjectController.getProjects);
router.post('/', ProjectController.createProject);
router.get('/:id', ProjectController.getProjectById);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);
router.get('/:id/tasks', ProjectController.getProjectTasks);

// Document routes under projects
router.get('/:projectId/documents', DocumentController.getProjectDocuments);
router.post('/:projectId/documents', DocumentController.createDocument);

export default router;
