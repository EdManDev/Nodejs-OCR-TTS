import winston from 'winston';
import config from '../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: config.server.nodeEnv === 'production' ? 'warn' : 'debug',
  }),
];

// File transports (only in production or when specified)
if (config.server.nodeEnv === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  // General log file
  transports.push(
    new winston.transports.File({
      filename: `${config.logging.filePath}/application.log`,
      format: fileFormat,
      level: config.logging.level,
    })
  );

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: `${config.logging.filePath}/error.log`,
      format: fileFormat,
      level: 'error',
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
(logger as any).stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;

// Utility functions for common logging patterns
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};

// Request logging utility
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userAgent?: string
) => {
  logger.http(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
    method,
    url,
    statusCode,
    responseTime,
    userAgent,
  });
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
};

// Job logging utilities
export const logJobStart = (jobId: string, jobType: string, metadata?: Record<string, any>) => {
  logger.info(`Job started: ${jobType}`, {
    jobId,
    jobType,
    ...metadata,
  });
};

export const logJobComplete = (
  jobId: string,
  jobType: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  logger.info(`Job completed: ${jobType} in ${duration}ms`, {
    jobId,
    jobType,
    duration,
    ...metadata,
  });
};

export const logJobError = (
  jobId: string,
  jobType: string,
  error: Error,
  metadata?: Record<string, any>
) => {
  logger.error(`Job failed: ${jobType}`, {
    jobId,
    jobType,
    error: error.message,
    stack: error.stack,
    ...metadata,
  });
};
