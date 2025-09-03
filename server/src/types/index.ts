export interface PDFDocument {
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
  textChunks?: TextChunk[];
  storageLocation: string;
  metadata: DocumentMetadata;
}

export interface TextChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  startPage: number;
  endPage: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number; // in seconds
  createdAt: Date;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  language?: string;
  pageSize?: PageSize;
  isScanned: boolean;
  ocrConfidence?: number;
}

export interface PageSize {
  width: number;
  height: number;
  unit: 'pt' | 'mm' | 'in';
}

export enum ProcessingStatus {
  UPLOADED = 'uploaded',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  EXTRACTING_TEXT = 'extracting_text',
  CHUNKING = 'chunking',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export enum JobType {
  PDF_UPLOAD = 'pdf_upload',
  TEXT_EXTRACTION = 'text_extraction',
  TEXT_CHUNKING = 'text_chunking',
  CLEANUP = 'cleanup'
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  STUCK = 'stuck'
}

export interface OCROptions {
  language: string;
  dpi: number;
  preserveInterword: boolean;
  tessedit_pageseg_mode: number;
  tessedit_char_whitelist?: string;
}

export interface ChunkingOptions {
  maxWordsPerChunk: number;
  overlapWords: number;
  preserveParagraphs: boolean;
  splitOnSentences: boolean;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  tempPath: string;
  storageType: 'local' | 's3';
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    processingTime?: number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileInfo?: {
    size: number;
    mimeType: string;
    extension: string;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  pages: PageOCRResult[];
  processingTime: number;
}

export interface PageOCRResult {
  pageNumber: number;
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
}

export interface BoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface StorageProvider {
  uploadFile(file: Express.Multer.File, key: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): Promise<string>;
  fileExists(key: string): Promise<boolean>;
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete: number;
  removeOnFail: number;
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  service?: string;
  requestId?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
    queue: ServiceHealth;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: Date;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

// Request/Response Types
export interface UploadDocumentRequest {
  file: Express.Multer.File;
  options?: {
    ocrLanguage?: string;
    chunkingOptions?: Partial<ChunkingOptions>;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface UploadDocumentResponse {
  documentId: string;
  jobId: string;
  estimatedProcessingTime: number;
  status: ProcessingStatus;
}

export interface GetDocumentResponse extends PDFDocument {
  downloadUrl?: string;
}

export interface GetDocumentsResponse {
  documents: PDFDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetTextChunksResponse {
  chunks: TextChunk[];
  totalChunks: number;
  documentInfo: {
    id: string;
    filename: string;
    pageCount: number;
    status: ProcessingStatus;
  };
}

// Error Types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ProcessingError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}
