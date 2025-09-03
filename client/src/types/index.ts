// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Document Types
export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
  processingJobId?: string;
  metadata?: DocumentMetadata;
  downloadUrl?: string;
}

export interface DocumentMetadata {
  pageCount?: number;
  ocrConfidence?: number;
  language?: string;
  wordCount?: number;
  processingTime?: number;
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Job Types
export interface ProcessingJob {
  id: string;
  documentId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  metadata?: JobMetadata;
  error?: string;
}

export enum JobType {
  OCR = 'ocr',
  TTS = 'tts',
  CHUNKING = 'chunking',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface JobMetadata {
  totalChunks?: number;
  processedChunks?: number;
  estimatedTimeRemaining?: number;
  errorCount?: number;
  retryCount?: number;
}

// Text Chunk Types
export interface TextChunk {
  id: string;
  documentId: string;
  chunkNumber: number;
  text: string;
  wordCount: number;
  readingTime: number;
  ttsStatus?: ChunkTTSStatus;
  audioUrl?: string;
  createdAt: string;
}

export enum ChunkTTSStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// TTS Types
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'google' | 'aws' | 'azure';
  isDefault: boolean;
}

export interface TTSOptions {
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  format: 'mp3' | 'wav' | 'ogg';
}

// Queue Types
export interface QueueJob {
  id: string;
  type: string;
  status: QueueJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  data: Record<string, any>;
  createdAt: string;
  processedAt?: string;
  failedAt?: string;
  error?: string;
}

export enum QueueJobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

// System Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
    ocr: ServiceHealth;
    tts: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  message?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Form Types
export interface UploadFormData {
  file: File;
  options?: {
    enableOCR: boolean;
    enableTTS: boolean;
    ttsOptions?: Partial<TTSOptions>;
  };
}

export interface FilterOptions {
  status?: DocumentStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}