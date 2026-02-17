import { prisma } from '../lib/prisma';
import { AppError } from '@shared/middleware/errorHandler';
import { EditAction } from '../generated/prisma';

export class DocumentService {
  /**
   * Create a new document for a project
   */
  static async createDocument(projectId: string, userId: string, title: string, content: string = '') {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const document = await prisma.document.create({
      data: {
        title,
        content,
        projectId,
        createdBy: userId,
      },
    });

    return document;
  }

  /**
   * Get all documents for a project
   */
  static async getProjectDocuments(projectId: string) {
    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return documents;
  }

  /**
   * Get document by ID with recent edits
   */
  static async getDocumentById(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        edits: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 edits
        },
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  /**
   * Update document content and track the edit
   */
  static async updateDocument(
    documentId: string,
    userId: string,
    userName: string,
    newContent: string,
    startPos: number,
    endPos: number,
    action: EditAction
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    console.log('[DocumentService] Update check - Document createdBy:', document.createdBy, 'Request userId:', userId);

    // Only creator can edit the document
    if (document.createdBy !== userId) {
      console.error('[DocumentService] Access denied - createdBy:', document.createdBy, 'userId:', userId);
      throw new AppError('Only the document creator can edit it', 403);
    }

    // Update document and create edit record in transaction
    const [updatedDocument] = await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: { content: newContent },
      }),
      prisma.documentEdit.create({
        data: {
          documentId,
          userId,
          userName,
          content: newContent.substring(startPos, endPos) || '',
          startPos,
          endPos,
          action,
        },
      }),
    ]);

    return updatedDocument;
  }

  /**
   * Get document edit history
   */
  static async getDocumentEdits(documentId: string, limit: number = 100) {
    const edits = await prisma.documentEdit.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return edits;
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Only creator can delete
    if (document.createdBy !== userId) {
      throw new AppError('Only the document creator can delete it', 403);
    }

    await prisma.document.delete({
      where: { id: documentId },
    });
  }
}
