import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import config from './config';
import logger from './utils/logger';
import { APIResponse } from './types';
import documentsRouter from './routes/documents';
import jobsRouter from './routes/jobs';
import ttsRouter from './routes/tts';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting (disabled in development)
if (config.server.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    } as APIResponse,
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure required directories exist
try {
  const requiredDirs = [config.upload.uploadPath, config.upload.tempPath, config.logging.filePath];
  requiredDirs.forEach((dir) => {
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (err) {
  logger.warn(`Failed to ensure required directories exist: ${(err as Error).message}`);
}

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Mount API routes
app.use('/api/documents', documentsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/tts', ttsRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    }
  } as APIResponse);
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Node.js OCR TTS API",
    data: {
      version: "1.0.0",
      endpoints: [
        "GET /api/health - Health check",
        "API routes coming soon..."
      ]
    }
  } as APIResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  } as APIResponse);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: config.server.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
  } as APIResponse);
});

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
  logger.info(`📝 Environment: ${config.server.nodeEnv}`);
  logger.info(`📊 Log level: ${config.logging.level}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;