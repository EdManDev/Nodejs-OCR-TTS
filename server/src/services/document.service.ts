import { ProcessingStatus, JobType, JobStatus } from '@prisma/client';
import { DocumentModel } from '../models/Document';
import { ProcessingJobModel } from '../models/ProcessingJob';
import { getStorageProvider } from '../storage';
import { OCRService, OCRResult } from './ocr.service';
import { ChunkingService } from './chunking.service';
import logger from '../utils/logger';
const pdfParse = require('pdf-parse');
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentUploadOptions {
  enableOCR?: boolean;
  enableChunking?: boolean;
  ocrLanguage?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  pageWidth?: number;
  pageHeight?: number;
  pageUnit?: string;
  isScanned?: boolean;
}

export interface ProcessingJobMetadata {
  language?: string;
  enableChunking?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  progress?: number;
  error?: string;
  [key: string]: any;
}

export class DocumentService {
  private ocrService: OCRService;
  private chunkingService: ChunkingService;

  constructor() {
    this.ocrService = new OCRService();
    this.chunkingService = new ChunkingService();
  }

  async uploadDocument(
    file: Buffer,
    originalName: string,
    mimeType: string,
    options: DocumentUploadOptions = {}
  ): Promise<string> {
    try {
      logger.info('Starting document upload', {
        originalName,
        mimeType,
        size: file.length,
        options,
      });

      // Store the file
      const storage = getStorageProvider();
      const storageLocation = await storage.uploadFile(file, originalName, mimeType);

      // Extract basic metadata
      const metadata = await this.extractMetadata(file, mimeType);

      // Create document record
      const document = await DocumentModel.create({
        filename: storageLocation,
        originalName,
        mimeType,
        size: file.length,
        pageCount: metadata.pageCount || 1,
        status: ProcessingStatus.UPLOADED,
        storageLocation,
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        creator: metadata.creator,
        producer: metadata.producer,
        creationDate: metadata.creationDate,
        modificationDate: metadata.modificationDate,
        pageWidth: metadata.pageWidth,
        pageHeight: metadata.pageHeight,
        pageUnit: metadata.pageUnit,
        isScanned: metadata.isScanned || false,
      });

      logger.info('Document uploaded successfully', {
        documentId: document.id,
        originalName,
        storageLocation,
      });

      // Start processing if enabled
      if (options.enableOCR) {
        await this.startOCRProcessing(document.id, options);
      }

      return document.id;
    } catch (error) {
      logger.error('Failed to upload document', {
        originalName,
        mimeType,
        error,
      });
      throw error;
    }
  }

  async startOCRProcessing(
    documentId: string,
    options: DocumentUploadOptions = {}
  ): Promise<void> {
    try {
      // Create processing job
      const job = await ProcessingJobModel.create({
        document: { connect: { id: documentId } },
        type: JobType.TEXT_EXTRACTION,
        status: JobStatus.WAITING,
        metadata: {
          language: options.ocrLanguage || 'eng',
          enableChunking: options.enableChunking || false,
          chunkSize: options.chunkSize || 1000,
          chunkOverlap: options.chunkOverlap || 200,
        },
      });

      // Update document status
      await DocumentModel.updateStatus(documentId, ProcessingStatus.QUEUED);

      logger.info('OCR processing job created', {
        documentId,
        jobId: job.id,
      });

      // Start processing (in a real application, this would be queued)
      setImmediate(() => this.processDocument(job.id));
    } catch (error) {
      logger.error('Failed to start OCR processing', {
        documentId,
        error,
      });
      throw error;
    }
  }

  private async processDocument(jobId: string): Promise<void> {
    let job = await ProcessingJobModel.findById(jobId);
    if (!job) {
      logger.error('Job not found', { jobId });
      return;
    }

    // Ensure metadata exists and has proper type
    if (!job.metadata) {
      logger.error('Job metadata is missing', { jobId });
      return;
    }

    const metadata = job.metadata as ProcessingJobMetadata;

    try {
      // Update job status
      await ProcessingJobModel.updateStatus(jobId, JobStatus.ACTIVE, { progress: 0 });

      // Update document status
      await DocumentModel.updateStatus(job.documentId, ProcessingStatus.PROCESSING);

      // Get document
      const document = await DocumentModel.findById(job.documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Download file from storage
      const storage = getStorageProvider();
      const fileBuffer = await storage.downloadFile(document.storageLocation);

      // Update progress
      await ProcessingJobModel.updateStatus(jobId, JobStatus.ACTIVE, { progress: 10 });

      // Perform OCR
      const ocrResults = await this.ocrService.extractTextFromBuffer(
        fileBuffer,
        document.mimeType,
        {
          language: metadata?.language || 'eng',
        }
      );

      // Update progress
      await ProcessingJobModel.updateStatus(jobId, JobStatus.ACTIVE, { progress: 70 });

      // Combine text from all pages
      const extractedText = ocrResults.map(result => result.text).join('\n\n');
      const averageConfidence = ocrResults.reduce((sum, result) => sum + result.confidence, 0) / ocrResults.length;

      // Update document with extracted text
      await DocumentModel.update(document.id, {
        extractedText,
        ocrConfidence: averageConfidence,
        status: ProcessingStatus.EXTRACTING_TEXT,
      });

      // Update progress
      await ProcessingJobModel.updateStatus(jobId, JobStatus.ACTIVE, { progress: 80 });

      // Chunk text if enabled
      if (metadata?.enableChunking) {
        await this.chunkText(document.id, extractedText, {
          chunkSize: metadata.chunkSize || 1000,
          chunkOverlap: metadata.chunkOverlap || 200,
        });
      }

      // Complete processing
      await ProcessingJobModel.updateStatus(jobId, JobStatus.COMPLETED, { progress: 100 });
      await DocumentModel.updateStatus(job.documentId, ProcessingStatus.COMPLETED);

      logger.info('Document processing completed', {
        documentId: job.documentId,
        jobId,
        textLength: extractedText.length,
        confidence: averageConfidence,
      });

    } catch (error) {
      logger.error('Document processing failed', {
        documentId: job.documentId,
        jobId,
        error,
      });

      // Update job and document status
      await ProcessingJobModel.updateStatus(jobId, JobStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await DocumentModel.updateStatus(job.documentId, ProcessingStatus.FAILED);
    }
  }

  private async chunkText(
    documentId: string,
    text: string,
    options: { chunkSize: number; chunkOverlap: number }
  ): Promise<void> {
    try {
      const chunks = await this.chunkingService.chunkText(text, options);
      
      // Save chunks to database
      await this.chunkingService.saveChunks(documentId, chunks);

      // Update document status
      await DocumentModel.updateStatus(documentId, ProcessingStatus.CHUNKING);

      logger.info('Text chunking completed', {
        documentId,
        chunkCount: chunks.length,
      });
    } catch (error) {
      logger.error('Text chunking failed', {
        documentId,
        error,
      });
      throw error;
    }
  }

  private async extractMetadata(file: Buffer, mimeType: string): Promise<DocumentMetadata> {
    try {
      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(file);
        
        return {
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          subject: pdfData.info?.Subject,
          creator: pdfData.info?.Creator,
          producer: pdfData.info?.Producer,
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
          pageCount: pdfData.numpages,
          isScanned: this.detectScannedPDF(pdfData.text),
        };
      }

      // For other file types, return minimal metadata
      return {
        pageCount: 1,
        isScanned: true, // Assume images are scanned
      };
    } catch (error) {
      logger.warn('Failed to extract metadata', { mimeType, error });
      return {
        pageCount: 1,
        isScanned: false,
      };
    }
  }

  private detectScannedPDF(text: string): boolean {
    // Simple heuristic: if PDF has very little text, it's likely scanned
    const textLength = text.trim().length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // If less than 50 words or very short text, likely scanned
    return wordCount < 50 || textLength < 200;
  }

  async getDocument(id: string): Promise<any> {
    return DocumentModel.findById(id);
  }

  async listDocuments(options: {
    skip?: number;
    take?: number;
    status?: ProcessingStatus;
    search?: string;
  } = {}): Promise<any> {
    const { skip = 0, take = 20, status, search } = options;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { extractedText: { contains: search, mode: 'insensitive' } },
      ];
    }

    return DocumentModel.findMany({
      skip,
      take,
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const document = await DocumentModel.findById(id);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from storage
      const storage = getStorageProvider();
      await storage.deleteFile(document.storageLocation);

      // Delete from database (will cascade to chunks and jobs)
      await DocumentModel.delete(id);

      logger.info('Document deleted successfully', { id });
    } catch (error) {
      logger.error('Failed to delete document', { id, error });
      throw error;
    }
  }

  async reprocessDocument(id: string): Promise<void> {
    try {
      const document = await DocumentModel.findById(id);
      if (!document) {
        throw new Error('Document not found');
      }

      // Reset document status
      await DocumentModel.update(id, {
        status: ProcessingStatus.UPLOADED,
        extractedText: null,
        ocrConfidence: null,
      });

      // Start processing again
      await this.startOCRProcessing(id);

      logger.info('Document reprocessing started', { id });
    } catch (error) {
      logger.error('Failed to reprocess document', { id, error });
      throw error;
    }
  }

  async getDocumentDownloadUrl(id: string): Promise<string> {
    const document = await DocumentModel.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const storage = getStorageProvider();
    return storage.getFileUrl(document.storageLocation);
  }

  async getDocumentStats(): Promise<any> {
    return DocumentModel.getStats();
  }

  async searchDocuments(query: string, options: {
    skip?: number;
    take?: number;
    includeContent?: boolean;
  } = {}): Promise<any> {
    const { skip = 0, take = 20, includeContent = false } = options;

    const startTime = Date.now();
    const result = await DocumentModel.search(query, { skip, take });
    const searchTime = Date.now() - startTime;

    return {
      documents: result.documents,
      totalResults: result.total,
      searchTime,
    };
  }
}