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

  /**
   * POST /api/projects/:projectId/documents/merge
   * Merge multiple documents into one (admin only)
   */
  static mergeDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { documentIds, newTitle } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least 2 document IDs are required for merging' 
      });
    }

    const mergedDocument = await DocumentService.mergeDocuments(
      projectId,
      userId,
      documentIds,
      newTitle
    );

    res.status(201).json({ 
      success: true, 
      data: mergedDocument,
      message: `Successfully merged ${documentIds.length} documents`
    });
  });

  /**
   * GET /api/documents/:documentId/download
   * Download document content
   */
  static downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { documentId } = req.params;

    const document = await DocumentService.downloadDocument(documentId, userId);

    // Set headers for file download
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send document content
    res.send(document.content);
  });
}
