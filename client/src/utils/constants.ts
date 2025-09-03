export const API_ENDPOINTS = {
  DOCUMENTS: '/documents',
  JOBS: '/jobs',
  TTS: '/tts',
  HEALTH: '/health',
} as const;

export const FILE_TYPES = {
  PDF: 'application/pdf',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DOCUMENT_STATUSES = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const JOB_TYPES = {
  OCR: 'ocr',
  TTS: 'tts',
  CHUNKING: 'chunking',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
} as const;

export const POLLING_INTERVALS = {
  JOBS: 10000, // 10 seconds (increased from 5s)
  DOCUMENTS: 15000, // 15 seconds (increased from 10s)
  HEALTH: 60000, // 60 seconds (increased from 30s)
  MAX_INTERVAL: 300000, // 5 minutes max
} as const;