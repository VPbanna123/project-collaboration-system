import { Request, Response } from 'express';
import { DocumentService } from '../services/documentService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { EditAction } from '../generated/prisma';

export class DocumentController {
  /**
   * POST /api/projects/:projectId/documents
   * Create a new document
   */
  static createDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const document = await DocumentService.createDocument(projectId, userId, title, content || '');
    res.status(201).json({ success: true, data: document });
  });

  /**
   * GET /api/projects/:projectId/documents
   * Get all documents for a project
   */
  static getProjectDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const documents = await DocumentService.getProjectDocuments(projectId);
    res.json({ success: true, data: documents });
  });

  /**
   * GET /api/documents/:documentId
   * Get document by ID with edits
   */
  static getDocumentById = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;

    const document = await DocumentService.getDocumentById(documentId);
    res.json({ success: true, data: document });
  });

  /**
   * PUT /api/documents/:documentId
   * Update document content
   */
  static updateDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { documentId } = req.params;
    const { content, startPos, endPos, action, userName } = req.body;

    if (content === undefined) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const document = await DocumentService.updateDocument(
      documentId,
      userId,
      userName || 'Unknown',
      content,
      startPos || 0,
      endPos || content.length,
      (action as EditAction) || 'REPLACE'
    );

    res.json({ success: true, data: document });
  });

  /**
   * GET /api/documents/:documentId/edits
   * Get document edit history
   */
  static getDocumentEdits = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const edits = await DocumentService.getDocumentEdits(documentId, limit);
    res.json({ success: true, data: edits });
  });

  /**
   * DELETE /api/documents/:documentId
   * Delete a document
   */
  static deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { documentId } = req.params;

    await DocumentService.deleteDocument(documentId, userId);
    res.json({ success: true, message: 'Document deleted' });
  });
}
