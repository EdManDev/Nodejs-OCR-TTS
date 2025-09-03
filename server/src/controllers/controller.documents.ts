import { Request, Response } from 'express';
import { APIResponse, ProcessingStatus } from '../types';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory store until database is set up
interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  pageCount: number;
  status: ProcessingStatus;
  uploadedAt: Date;
  processedAt?: Date;
  extractedText?: string;
  storageLocation: string;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageWidth?: number;
  pageHeight?: number;
  pageUnit?: string;
  isScanned?: boolean;
  ocrConfidence?: number;
}

export class DocumentController {
  private documents: Map<string, Document> = new Map();

  /**
   * GET /api/documents
   * List all documents with pagination and filtering
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ProcessingStatus;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;

      // Filter documents
      let filteredDocs = Array.from(this.documents.values());

      if (status) {
        filteredDocs = filteredDocs.filter(doc => doc.status === status);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredDocs = filteredDocs.filter(doc =>
          doc.originalName.toLowerCase().includes(searchLower) ||
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.author?.toLowerCase().includes(searchLower) ||
          doc.extractedText?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by upload date (newest first)
      filteredDocs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      const total = filteredDocs.length;
      const documents = filteredDocs.slice(skip, skip + limit);

      const response = {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      };

      res.status(200).json({
        success: true,
        message: 'Documents retrieved successfully',
        data: response,
        metadata: {
          page,
          limit,
          total,
          processingTime: Date.now() % 100,
        },
      } as APIResponse);
    } catch (error) {
      logger.error('Error retrieving documents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve documents',
      } as APIResponse);
    }
  }

  /**
   * GET /api/documents/:id
   * Get document details by ID
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);

      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      const response = {
        ...document,
        downloadUrl: `${req.protocol}://${req.get('host')}/api/documents/${id}/download`,
        metadata: {
          title: document.title,
          author: document.author,
          subject: document.subject,
          creator: document.creator,
          producer: document.producer,
          creationDate: document.creationDate,
          isScanned: document.isScanned,
          ocrConfidence: document.ocrConfidence,
          pageSize: document.pageWidth && document.pageHeight ? {
            width: document.pageWidth,
            height: document.pageHeight,
            unit: document.pageUnit || 'pt',
          } : undefined,
        },
      };

      res.status(200).json({
        success: true,
        message: 'Document details retrieved successfully',
        data: response,
      } as APIResponse);
    } catch (error) {
      logger.error('Error retrieving document details:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve document details',
      } as APIResponse);
    }
  }

  /**
   * POST /api/documents/upload
   * Upload a new PDF document for processing
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please provide a PDF file to upload',
        } as APIResponse);
        return;
      }

      const { ocrLanguage = 'eng', priority = 'normal', enableOCR = true, enableChunking = true } = req.body;

      // Read file buffer
      const fileBuffer = await fs.readFile(req.file.path);

      // Create document record
      const documentId = uuidv4();
      const uploadsDir = path.resolve(process.cwd(), 'uploads');

      // Ensure uploads directory exists
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      const storageLocation = path.join(uploadsDir, `${documentId}_${req.file.originalname}`);

      // Save file to uploads directory
      await fs.copyFile(req.file.path, storageLocation);

      // Create document object
      const document: Document = {
        id: documentId,
        filename: `${documentId}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        pageCount: 1, // Default, would be extracted in real implementation
        status: ProcessingStatus.UPLOADED,
        uploadedAt: new Date(),
        storageLocation,
        isScanned: true, // Assume PDF needs OCR
      };

      // Store in memory
      this.documents.set(documentId, document);

      // Simulate processing delay
      setTimeout(() => {
        const doc = this.documents.get(documentId);
        if (doc) {
          doc.status = ProcessingStatus.COMPLETED;
          doc.processedAt = new Date();
          doc.extractedText = `Extracted text from ${doc.originalName}. This is simulated text extraction.`;
          doc.ocrConfidence = 95.5;
          this.documents.set(documentId, doc);
        }
      }, 3000);

      // Clean up temporary file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn('Failed to delete temporary file:', unlinkError);
      }

      const response = {
        documentId,
        jobId: `job_${Date.now()}`, // This would be the actual job ID in a real queue system
        estimatedProcessingTime: 120, // seconds
        status: ProcessingStatus.QUEUED,
        message: 'Document uploaded successfully and queued for processing',
      };

      logger.info(`Document uploaded successfully: ${req.file.originalname}`, {
        documentId,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully and queued for processing',
        data: response,
      } as APIResponse);
    } catch (error) {
      logger.error('Error uploading file:', error);

      // Clean up temporary file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.warn('Failed to delete temporary file after error:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to upload file',
      } as APIResponse);
    }
  }

  /**
   * GET /api/documents/:id/chunks
   * Get text chunks for a specific document
   */
  async getDocumentChunks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      // Generate mock chunks from extracted text
      const mockChunks = [];
      if (document.extractedText) {
        const words = document.extractedText.split(' ');
        const chunkSize = 100; // words per chunk
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunkWords = words.slice(i, i + chunkSize);
          const content = chunkWords.join(' ');
          mockChunks.push({
            id: `chunk_${id}_${Math.floor(i / chunkSize) + 1}`,
            documentId: id,
            chunkIndex: Math.floor(i / chunkSize) + 1,
            content,
            startPage: 1,
            endPage: 1,
            wordCount: chunkWords.length,
            characterCount: content.length,
            estimatedReadingTime: Math.ceil(chunkWords.length / 200 * 60), // ~200 wpm
            createdAt: new Date(),
          });
        }
      }

      const skip = (page - 1) * limit;
      const chunks = mockChunks.slice(skip, skip + limit);

      const response = {
        chunks,
        totalChunks: mockChunks.length,
        documentInfo: {
          id: document.id,
          filename: document.originalName,
          pageCount: document.pageCount,
          status: document.status,
        },
      };

      res.status(200).json({
        success: true,
        message: 'Text chunks retrieved successfully',
        data: response,
        metadata: {
          page,
          limit,
          total: mockChunks.length,
          processingTime: Date.now() % 50,
        },
      } as APIResponse);
    } catch (error) {
      logger.error('Error retrieving text chunks:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve text chunks',
      } as APIResponse);
    }
  }

  /**
   * GET /api/documents/:id/download
   * Download the original document file
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Document download link generated',
        data: {
          downloadUrl: `${req.protocol}://${req.get('host')}/api/documents/${id}/file`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          filename: document.originalName,
        },
      } as APIResponse);
    } catch (error) {
      logger.error('Error generating download link:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to generate download link',
      } as APIResponse);
    }
  }

  /**
   * GET /api/documents/:id/file
   * Serve the actual document file
   */
  async serveDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      const filePath = path.isAbsolute(document.storageLocation)
        ? document.storageLocation
        : path.resolve(process.cwd(), document.storageLocation);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({
          success: false,
          error: 'File not found',
          message: 'The document file could not be found on the server',
        } as APIResponse);
        return;
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.size);

      // Stream the file
      const fileStream = await fs.readFile(filePath);
      res.send(fileStream);
    } catch (error) {
      logger.error('Error serving document file:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to serve document file',
      } as APIResponse);
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete a document and its associated data
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      // Delete file from storage
      try {
        const filePath = path.isAbsolute(document.storageLocation)
          ? document.storageLocation
          : path.resolve(process.cwd(), document.storageLocation);
        await fs.unlink(filePath);
      } catch (fileError) {
        logger.warn('Failed to delete file from storage:', fileError);
      }

      // Remove from memory
      this.documents.delete(id);

      logger.info(`Document deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          deletedDocumentId: id,
          deletedAt: new Date().toISOString(),
        },
      } as APIResponse);
    } catch (error) {
      logger.error('Error deleting document:', error);

      if (error instanceof Error && error.message === 'Document not found') {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: error.message,
        } as APIResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to delete document',
        } as APIResponse);
      }
    }
  }

  /**
   * POST /api/documents/:id/reprocess
   * Reprocess a document with different options
   */
  async reprocessDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { ocrLanguage, chunkingOptions } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
          message: 'Document ID is required',
        } as APIResponse);
        return;
      }

      const document = this.documents.get(id);
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `Document with ID ${id} not found`,
        } as APIResponse);
        return;
      }

      // Reset document status
      document.status = ProcessingStatus.QUEUED;
      document.extractedText = undefined;
      document.ocrConfidence = undefined;
      document.processedAt = undefined;
      this.documents.set(id, document);

      // Simulate reprocessing
      setTimeout(() => {
        const doc = this.documents.get(id);
        if (doc) {
          doc.status = ProcessingStatus.COMPLETED;
          doc.processedAt = new Date();
          doc.extractedText = `Reprocessed text from ${doc.originalName}. This is simulated reprocessing.`;
          doc.ocrConfidence = 92.3;
          this.documents.set(id, doc);
        }
      }, 5000);

      const response = {
        documentId: id,
        jobId: `job_reprocess_${Date.now()}`,
        estimatedProcessingTime: 90,
        status: ProcessingStatus.QUEUED,
        options: {
          ocrLanguage: ocrLanguage || 'eng',
          chunkingOptions: chunkingOptions || {},
        },
      };

      res.status(200).json({
        success: true,
        message: 'Document reprocessing initiated',
        data: response,
      } as APIResponse);
    } catch (error) {
      logger.error('Error reprocessing document:', error);

      if (error instanceof Error && error.message === 'Document not found') {
        res.status(404).json({
          success: false,
          error: 'Document not found',
          message: error.message,
        } as APIResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to reprocess document',
        } as APIResponse);
      }
    }
  }

  /**
   * GET /api/documents/stats
   * Get document processing statistics
   */
  async getDocumentStats(req: Request, res: Response): Promise<void> {
    try {
      const docs = Array.from(this.documents.values());
      const total = docs.length;
      const completed = docs.filter(doc => doc.status === ProcessingStatus.COMPLETED).length;
      const failed = docs.filter(doc => doc.status === ProcessingStatus.FAILED).length;
      const processing = docs.filter(doc => doc.status === ProcessingStatus.PROCESSING || doc.status === ProcessingStatus.QUEUED).length;

      const stats = {
        total,
        byStatus: {
          [ProcessingStatus.COMPLETED]: completed,
          [ProcessingStatus.FAILED]: failed,
          [ProcessingStatus.PROCESSING]: processing,
          [ProcessingStatus.UPLOADED]: docs.filter(doc => doc.status === ProcessingStatus.UPLOADED).length,
        },
        processingTimeAverage: 45, // Mock average in seconds
        successRate: total > 0 ? (completed / (completed + failed)) * 100 : 0,
        recentActivity: docs.slice(-10).map(doc => ({
          date: doc.uploadedAt.toISOString().split('T')[0],
          uploads: 1,
          processed: doc.status === ProcessingStatus.COMPLETED ? 1 : 0,
          failed: doc.status === ProcessingStatus.FAILED ? 1 : 0,
        })),
      };

      res.status(200).json({
        success: true,
        message: 'Document statistics retrieved successfully',
        data: stats,
      } as APIResponse);
    } catch (error) {
      logger.error('Error retrieving document stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve document statistics',
      } as APIResponse);
    }
  }

  /**
   * GET /api/documents/search
   * Search documents by content
   */
  async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Missing search query',
          message: 'Search query (q) is required',
        } as APIResponse);
        return;
      }

      const skip = (page - 1) * limit;

      // Search through documents
      const searchLower = query.toLowerCase();
      const matchedDocs = Array.from(this.documents.values()).filter(doc =>
        doc.originalName.toLowerCase().includes(searchLower) ||
        doc.title?.toLowerCase().includes(searchLower) ||
        doc.author?.toLowerCase().includes(searchLower) ||
        doc.extractedText?.toLowerCase().includes(searchLower)
      );

      const results = {
        documents: matchedDocs.slice(skip, skip + limit),
        totalResults: matchedDocs.length,
        searchTime: Math.random() * 50 + 10, // Mock search time
      };

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          query,
          documents: results.documents,
          totalResults: results.totalResults,
          searchTime: results.searchTime,
          pagination: {
            page,
            limit,
            total: results.totalResults,
            totalPages: Math.ceil(results.totalResults / limit),
          },
        },
      } as APIResponse);
    } catch (error) {
      logger.error('Error searching documents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to search documents',
      } as APIResponse);
    }
  }
}

// Export singleton instance
export const documentController = new DocumentController();