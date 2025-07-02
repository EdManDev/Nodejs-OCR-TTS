import dotenv from 'dotenv';
import { ChunkingOptions, OCROptions, QueueConfig, UploadConfig } from '../types';

dotenv.config();

interface Config {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  upload: UploadConfig;
  ocr: OCROptions;
  chunking: ChunkingOptions;
  security: {
    jwtSecret: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
  processing: {
    maxConcurrentJobs: number;
    jobTimeoutMs: number;
    cleanupIntervalHours: number;
  };
  queues: {
    textExtraction: QueueConfig;
    textChunking: QueueConfig;
    cleanup: QueueConfig;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3BucketName: string;
  };
}

function parseFileSize(sizeStr: string): number {
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeStr}`);
  }
  
  const [, size, unit] = match;
  return parseFloat(size) * units[unit.toUpperCase() as keyof typeof units];
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ocr_tts_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  upload: {
    maxFileSize: parseFileSize(process.env.MAX_FILE_SIZE || '100MB'),
    allowedMimeTypes: [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    tempPath: process.env.TEMP_PATH || './temp',
    storageType: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
  },
  ocr: {
    language: process.env.TESSERACT_LANG || 'eng',
    dpi: parseInt(process.env.OCR_DPI || '300', 10),
    preserveInterword: true,
    tessedit_pageseg_mode: 1, // Automatic page segmentation with OSD
  },
  chunking: {
    maxWordsPerChunk: parseInt(process.env.MAX_WORDS_PER_CHUNK || '1000', 10),
    overlapWords: parseInt(process.env.OVERLAP_WORDS || '50', 10),
    preserveParagraphs: true,
    splitOnSentences: true,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  processing: {
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),
    jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10),
    cleanupIntervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '24', 10),
  },
  queues: {
    textExtraction: {
      name: 'text-extraction',
      concurrency: 3,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
    textChunking: {
      name: 'text-chunking',
      concurrency: 5,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
    cleanup: {
      name: 'cleanup',
      concurrency: 1,
      attempts: 1,
      backoff: {
        type: 'fixed',
        delay: 1000,
      },
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  },
};

// Add AWS config if S3 is enabled
if (config.upload.storageType === 's3') {
  config.aws = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
  };
}

// Validation
function validateConfig(): void {
  const requiredEnvVars: { [key: string]: string | undefined } = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  if (config.upload.storageType === 's3') {
    requiredEnvVars.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    requiredEnvVars.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    requiredEnvVars.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  if (config.upload.maxFileSize < 1024 || config.upload.maxFileSize > 1024 * 1024 * 1024) {
    throw new Error('MAX_FILE_SIZE must be between 1KB and 1GB');
  }
}

// Only validate in production
if (config.server.nodeEnv === 'production') {
  validateConfig();
}

export default config;
