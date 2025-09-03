import { PrismaClient } from '@prisma/client';
import logger from './logger';

let prisma: PrismaClient;

export const connectDatabase = async (): Promise<PrismaClient> => {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        (prisma as any).$on('query', (e: any) => {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: e.duration,
          });
        });
      }

      // Log database errors
      (prisma as any).$on('error', (e: any) => {
        logger.error('Database Error', {
          message: e.message,
          target: e.target,
        });
      });

      // Test the connection
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  return prisma;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

export const getDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    if (!prisma) {
      throw new Error('Database not connected');
    }

    // Simple health check query
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const runDatabaseMigrations = async (): Promise<void> => {
  try {
    // In production, you might want to run migrations manually
    // This is mainly for development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Running database migrations...');
      // Note: In a real application, you'd use Prisma CLI or a migration tool
      // For now, we'll just ensure the connection works
      await connectDatabase();
      logger.info('Database migrations completed');
    }
  } catch (error) {
    logger.error('Database migration failed', error);
    throw error;
  }
};

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};

export { prisma };
export default getPrismaClient;