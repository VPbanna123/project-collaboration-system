import { prisma } from '../lib/prisma';
import { AppError } from '@shared/middleware/errorHandler';
import { EditAction } from '../generated/prisma';
import axios from 'axios';

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

    // Check if user has permission to edit
    // User can edit if:
    // 1. They are the creator, OR
    // 2. They are a member of the project's team (checked via team service)
    let canEdit = document.createdBy === userId;
    
    if (!canEdit && document.projectId) {
      // Get the project to check team membership
      const project = await prisma.project.findUnique({
        where: { id: document.projectId },
      });
      
      if (project?.teamId) {
        // Check if user is a team member via team service
        try {
          const teamServiceUrl = process.env.TEAM_SERVICE_URL || 'http://localhost:3002';
          const response = await axios.get(
            `${teamServiceUrl}/api/teams/${project.teamId}/check-member/${userId}`,
            {
              headers: {
                'x-internal-api-key': process.env.INTERNAL_API_KEY,
              },
            }
          );
          canEdit = response.data?.isMember === true;
          console.log('[DocumentService] Team member check - isMember:', canEdit, 'userId:', userId);
        } catch (error) {
          console.error('[DocumentService] Failed to check team membership:', error);
          // If team service is down, only allow creator to edit
        }
      }
    }

    if (!canEdit) {
      console.error('[DocumentService] Access denied - createdBy:', document.createdBy, 'userId:', userId);
      throw new AppError('You do not have permission to edit this document', 403);
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
