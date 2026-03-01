import { prisma } from '../lib/prisma';
import { AppError } from '@shared/middleware/errorHandler';
import { EditAction } from '../generated/prisma';
import { teamServiceClient } from '../grpc/clients/teamClient';

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
        // Check if user is a team member via gRPC
        try {
          canEdit = await teamServiceClient.checkMember(project.teamId, userId);
          console.log('[DocumentService] Team member check via gRPC - isMember:', canEdit, 'userId:', userId);
        } catch (error) {
          console.error('[DocumentService] gRPC checkMember failed:', error);
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

  /**
   * Merge multiple documents into one (admin only)
   * Combines content from source documents and creates a new merged document
   */
  static async mergeDocuments(
    projectId: string,
    userId: string,
    documentIds: string[],
    newTitle?: string
  ) {
    // Validate input
    if (!documentIds || documentIds.length < 2) {
      throw new AppError('At least 2 documents are required for merging', 400);
    }

    // Get project and verify it exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!project.teamId) {
      throw new AppError('Project must belong to a team', 400);
    }

    // Check if user is admin of the project's team using gRPC
    let isAdmin = false;
    try {
      isAdmin = await teamServiceClient.checkAdmin(project.teamId, userId);
      console.log('[DocumentService] Admin check via gRPC - teamId:', project.teamId, 'userId:', userId, 'isAdmin:', isAdmin);
    } catch (error) {
      console.error('[DocumentService] gRPC checkAdmin failed:', error);
      throw new AppError('Failed to verify admin privileges', 500);
    }

    if (!isAdmin) {
      throw new AppError('Only team admins can merge documents', 403);
    }

    // Fetch all source documents and verify they belong to the same project
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        projectId,
      },
      orderBy: { createdAt: 'asc' }, // Merge in order of creation
    });

    if (documents.length !== documentIds.length) {
      throw new AppError('Some documents not found or do not belong to this project', 404);
    }

    // Combine document content
    const mergedContent = documents.map((doc, index) => {
      const separator = index === 0 ? '' : '\n\n---\n\n'; // Add separator between docs
      const header = `# ${doc.title}\n\n`; // Add header for each merged doc
      return separator + header + doc.content;
    }).join('');

    // Create title for merged document
    const mergedTitle = newTitle || `Merged: ${documents.map(d => d.title).join(' + ')}`;

    // Create the new merged document
    const mergedDocument = await prisma.document.create({
      data: {
        title: mergedTitle,
        content: mergedContent,
        projectId,
        createdBy: userId,
        isMerged: true,
        mergedFrom: documentIds,
        mergedBy: userId,
        mergedAt: new Date(),
      },
    });

    console.log(`[DocumentService] Merged ${documentIds.length} documents into ${mergedDocument.id}`);

    return mergedDocument;
  }

  /**
   * Get document content for download
   * Returns document with formatted content
   */
  static async downloadDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check if user has access to the document
    // User can download if they are a member of the project's team
    let hasAccess = false;

    if (document.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: document.projectId },
      });

      if (project?.teamId) {
        try {
          hasAccess = await teamServiceClient.checkMember(project.teamId, userId);
          console.log('[DocumentService] Download access check via gRPC - isMember:', hasAccess, 'userId:', userId);
        } catch (error) {
          console.error('[DocumentService] gRPC checkMember failed:', error);
          throw new AppError('Failed to verify access permissions', 500);
        }
      }
    }

    if (!hasAccess) {
      throw new AppError('You do not have permission to download this document', 403);
    }

    return document;
  }
}
