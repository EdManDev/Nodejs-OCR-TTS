import { Router, Request, Response } from 'express';
import multer from 'multer';
import { APIResponse, PDFDocument, GetDocumentsResponse, GetDocumentResponse, GetTextChunksResponse, ProcessingStatus } from '../types';
import logger from '../utils/logger';
import config from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: config.upload.tempPath,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  },
});

/**
 * GET /api/documents
 * List all documents with pagination
 */
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as ProcessingStatus;
  const search = req.query.search as string;

  // Mock data - replace with actual database query
  const mockDocuments: PDFDocument[] = [
    {
      id: 'doc_1',
      filename: 'sample-document.pdf',
      originalName: 'Sample Document.pdf',
      mimeType: 'application/pdf',
      size: 2048576,
      pageCount: 15,
      status: ProcessingStatus.COMPLETED,
      uploadedAt: new Date('2024-01-15T10:30:00Z'),
      processedAt: new Date('2024-01-15T10:35:00Z'),
      storageLocation: '/uploads/doc_1.pdf',
      metadata: {
        title: 'Sample Document',
        author: 'John Doe',
        isScanned: false,
        ocrConfidence: 95.5
      }
    },
    {
      id: 'doc_2',
      filename: 'research-paper.pdf',
      originalName: 'Research Paper.pdf',
      mimeType: 'application/pdf',
      size: 5242880,
      pageCount: 25,
      status: ProcessingStatus.PROCESSING,
      uploadedAt: new Date('2024-01-15T11:00:00Z'),
      storageLocation: '/uploads/doc_2.pdf',
      metadata: {
        title: 'Research Paper on AI',
        author: 'Jane Smith',
        isScanned: true,
        ocrConfidence: 88.2
      }
    }
  ];

  const filteredDocs = mockDocuments.filter(doc => {
    if (status && doc.status !== status) return false;
    if (search && !doc.originalName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = filteredDocs.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const documents = filteredDocs.slice(startIndex, endIndex);

  const response: GetDocumentsResponse = {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  res.status(200).json({
    success: true,
    message: "Documents retrieved successfully",
    data: response,
    metadata: {
      page,
      limit,
      total,
      processingTime: Date.now() % 100 // Mock processing time
    }
  } as APIResponse<GetDocumentsResponse>);
});

/**
 * GET /api/documents/:id
 * Get document details by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Mock data - replace with actual database query
  const mockDocument: GetDocumentResponse = {
    id,
    filename: 'sample-document.pdf',
    originalName: 'Sample Document.pdf',
    mimeType: 'application/pdf',
    size: 2048576,
    pageCount: 15,
    status: ProcessingStatus.COMPLETED,
    uploadedAt: new Date('2024-01-15T10:30:00Z'),
    processedAt: new Date('2024-01-15T10:35:00Z'),
    extractedText: 'This is the extracted text from the PDF document...',
    storageLocation: '/uploads/sample-document.pdf',
    downloadUrl: `${req.protocol}://${req.get('host')}/api/documents/${id}/download`,
    metadata: {
      title: 'Sample Document',
      author: 'John Doe',
      subject: 'Technical Documentation',
      creationDate: new Date('2024-01-10T08:00:00Z'),
      isScanned: false,
      ocrConfidence: 95.5,
      pageSize: {
        width: 612,
        height: 792,
        unit: 'pt'
      }
    }
  };

  if (!mockDocument) {
    return res.status(404).json({
      success: false,
      error: 'Document not found',
      message: `Document with ID ${id} does not exist`
    } as APIResponse);
  }

  res.status(200).json({
    success: true,
    message: "Document details retrieved successfully",
    data: mockDocument
  } as APIResponse<GetDocumentResponse>);
});

/**
 * POST /api/documents/upload
 * Upload a new PDF document for processing
 */
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      message: 'Please provide a PDF file to upload'
    } as APIResponse);
  }

  const { ocrLanguage, priority } = req.body;
  
  // Mock response - replace with actual upload processing
  const mockResponse = {
    documentId: `doc_${Date.now()}`,
    jobId: `job_${Date.now()}`,
    estimatedProcessingTime: 120, // seconds
    status: ProcessingStatus.QUEUED
  };

  logger.info(`File uploaded: ${req.file.originalname}`, {
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  res.status(201).json({
    success: true,
    message: "File uploaded successfully and queued for processing",
    data: mockResponse
  } as APIResponse);
});

/**
 * GET /api/documents/:id/chunks
 * Get text chunks for a specific document
 */
router.get('/:id/chunks', (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Mock data - replace with actual database query
  const mockChunks = Array.from({ length: 45 }, (_, index) => ({
    id: `chunk_${id}_${index + 1}`,
    documentId: id,
    chunkIndex: index + 1,
    content: `This is chunk ${index + 1} of the document. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    startPage: Math.floor(index / 3) + 1,
    endPage: Math.floor(index / 3) + 1,
    wordCount: 45 + Math.floor(Math.random() * 20),
    characterCount: 280 + Math.floor(Math.random() * 100),
    estimatedReadingTime: 15 + Math.floor(Math.random() * 10),
    createdAt: new Date()
  }));

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const chunks = mockChunks.slice(startIndex, endIndex);

  const response: GetTextChunksResponse = {
    chunks,
    totalChunks: mockChunks.length,
    documentInfo: {
      id,
      filename: 'sample-document.pdf',
      pageCount: 15,
      status: ProcessingStatus.COMPLETED
    }
  };

  res.status(200).json({
    success: true,
    message: "Text chunks retrieved successfully",
    data: response,
    metadata: {
      page,
      limit,
      total: mockChunks.length,
      processingTime: Date.now() % 50
    }
  } as APIResponse<GetTextChunksResponse>);
});

/**
 * GET /api/documents/:id/download
 * Download the original document file
 */
router.get('/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;

  // Mock response - replace with actual file serving
  res.status(200).json({
    success: true,
    message: "Document download link generated",
    data: {
      downloadUrl: `https://example.com/download/${id}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      filename: 'sample-document.pdf'
    }
  } as APIResponse);
});

/**
 * DELETE /api/documents/:id
 * Delete a document and its associated data
 */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Mock response - replace with actual deletion logic
  logger.info(`Document deletion requested: ${id}`);

  res.status(200).json({
    success: true,
    message: "Document deleted successfully",
    data: {
      deletedDocumentId: id,
      deletedAt: new Date().toISOString()
    }
  } as APIResponse);
});

/**
 * POST /api/documents/:id/reprocess
 * Reprocess a document with different options
 */
router.post('/:id/reprocess', (req: Request, res: Response) => {
  const { id } = req.params;
  const { ocrLanguage, chunkingOptions } = req.body;

  // Mock response - replace with actual reprocessing logic
  const mockResponse = {
    documentId: id,
    jobId: `job_reprocess_${Date.now()}`,
    estimatedProcessingTime: 90,
    status: ProcessingStatus.QUEUED,
    options: {
      ocrLanguage: ocrLanguage || 'eng',
      chunkingOptions: chunkingOptions || {}
    }
  };

  res.status(200).json({
    success: true,
    message: "Document reprocessing initiated",
    data: mockResponse
  } as APIResponse);
});

export default router;
