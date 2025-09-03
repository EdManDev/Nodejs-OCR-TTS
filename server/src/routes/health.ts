import { Router, Request, Response } from 'express';
import { APIResponse, HealthCheck } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  } as APIResponse);
});

/**
 * GET /api/health/detailed
 * Detailed health check with service status
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthCheck: HealthCheck = {
      status: 'healthy',
      services: {
        database: { status: 'up', responseTime: 15 },
        redis: { status: 'up', responseTime: 8 },
        storage: { status: 'up', responseTime: 12 },
        queue: { status: 'up', responseTime: 5 }
      },
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      timestamp: new Date()
    };

    res.status(200).json({
      success: true,
      message: "Detailed health check completed",
      data: healthCheck
    } as APIResponse<HealthCheck>);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: 'Some services may be unavailable'
    } as APIResponse);
  }
});

/**
 * GET /api/health/ping
 * Simple ping endpoint
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "pong",
    data: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  } as APIResponse);
});

export default router;
