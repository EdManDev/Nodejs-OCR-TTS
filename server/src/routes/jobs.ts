import { Router, Request, Response } from 'express';
import { APIResponse, ProcessingJob, JobType, JobStatus } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/jobs
 * List all processing jobs with filtering and pagination
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as JobStatus;
    const type = req.query.type as JobType;
    const documentId = req.query.documentId as string;

  // Mock data - replace with actual database query
  const mockJobs: ProcessingJob[] = [
    {
      id: 'job_1',
      documentId: 'doc_1',
      type: JobType.TEXT_EXTRACTION,
      status: JobStatus.COMPLETED,
      progress: 100,
      startedAt: new Date('2024-01-15T10:30:00Z'),
      completedAt: new Date('2024-01-15T10:33:30Z'),
      metadata: {
        pages: 15,
        ocrEngine: 'tesseract',
        language: 'eng',
        confidence: 95.5
      }
    },
    {
      id: 'job_2',
      documentId: 'doc_1',
      type: JobType.TEXT_CHUNKING,
      status: JobStatus.COMPLETED,
      progress: 100,
      startedAt: new Date('2024-01-15T10:33:30Z'),
      completedAt: new Date('2024-01-15T10:35:00Z'),
      metadata: {
        totalChunks: 45,
        maxWordsPerChunk: 1000,
        overlapWords: 50
      }
    },
    {
      id: 'job_3',
      documentId: 'doc_2',
      type: JobType.TEXT_EXTRACTION,
      status: JobStatus.ACTIVE,
      progress: 68,
      startedAt: new Date('2024-01-15T11:05:00Z'),
      metadata: {
        pages: 25,
        currentPage: 17,
        ocrEngine: 'tesseract',
        language: 'eng'
      }
    },
    {
      id: 'job_4',
      documentId: 'doc_3',
      type: JobType.PDF_UPLOAD,
      status: JobStatus.WAITING,
      progress: 0,
      metadata: {
        priority: 'normal',
        estimatedStartTime: new Date(Date.now() + 300000) // 5 minutes from now
      }
    }
  ];

  // Apply filters
  const filteredJobs = mockJobs.filter(job => {
    if (status && job.status !== status) return false;
    if (type && job.type !== type) return false;
    if (documentId && job.documentId !== documentId) return false;
    return true;
  });

  const total = filteredJobs.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const jobs = filteredJobs.slice(startIndex, endIndex);

  return res.status(200).json({
    success: true,
    message: "Processing jobs retrieved successfully",
    data: {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    metadata: {
      page,
      limit,
      total,
      processingTime: Date.now() % 50
    }
  } as APIResponse);
  } catch (error) {
    logger.error('Error retrieving processing jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve processing jobs'
    } as APIResponse);
  }
});

/**
 * GET /api/jobs/:id
 * Get specific job details by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
        message: 'Job ID is required'
      } as APIResponse);
    }

    // Mock data - replace with actual database query
    const mockJob: ProcessingJob = {
      id,
      documentId: 'doc_1',
      type: JobType.TEXT_EXTRACTION,
      status: JobStatus.COMPLETED,
      progress: 100,
      startedAt: new Date('2024-01-15T10:30:00Z'),
      completedAt: new Date('2024-01-15T10:33:30Z'),
      metadata: {
        pages: 15,
        ocrEngine: 'tesseract',
        language: 'eng',
        confidence: 95.5,
        processingTime: 210, // seconds
        workerNode: 'worker-01',
        memoryUsage: '256MB',
        outputSize: 15420 // bytes
      }
    };

    // In a real implementation, check if job exists in database
    // For now, we'll just return the mock data
    return res.status(200).json({
      success: true,
      message: "Job details retrieved successfully",
      data: mockJob
    } as APIResponse<ProcessingJob>);
  } catch (error) {
    logger.error('Error retrieving job details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve job details'
    } as APIResponse);
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics and queue information
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    // Mock statistics - replace with actual queue stats
    const stats = {
      overview: {
        totalJobs: 156,
        activeJobs: 3,
        completedJobs: 142,
        failedJobs: 8,
        waitingJobs: 3
      },
      byType: {
        [JobType.PDF_UPLOAD]: { total: 52, completed: 50, failed: 1, active: 1 },
        [JobType.TEXT_EXTRACTION]: { total: 52, completed: 48, failed: 3, active: 1 },
        [JobType.TEXT_CHUNKING]: { total: 52, completed: 44, failed: 4, active: 1 },
        [JobType.CLEANUP]: { total: 0, completed: 0, failed: 0, active: 0 }
      },
      performance: {
        averageProcessingTime: {
          [JobType.PDF_UPLOAD]: 15, // seconds
          [JobType.TEXT_EXTRACTION]: 125,
          [JobType.TEXT_CHUNKING]: 30,
          [JobType.CLEANUP]: 5
        },
        throughputPerHour: {
          [JobType.PDF_UPLOAD]: 45,
          [JobType.TEXT_EXTRACTION]: 28,
          [JobType.TEXT_CHUNKING]: 120,
          [JobType.CLEANUP]: 200
        }
      },
      queues: {
        textExtraction: {
          waiting: 1,
          active: 1,
          completed: 48,
          failed: 3,
          delayed: 0
        },
        textChunking: {
          waiting: 2,
          active: 1,
          completed: 44,
          failed: 4,
          delayed: 0
        },
        cleanup: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0
        }
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: "Job statistics retrieved successfully",
      data: stats
    } as APIResponse);
  } catch (error) {
    logger.error('Error retrieving job statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve job statistics'
    } as APIResponse);
  }
});

/**
 * POST /api/jobs/:id/cancel
 * Cancel a specific job
 */
router.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
        message: 'Job ID is required'
      } as APIResponse);
    }

    // Mock response - replace with actual job cancellation logic
    logger.info(`Job cancellation requested: ${id}`, { reason });

    return res.status(200).json({
      success: true,
      message: "Job cancelled successfully",
      data: {
        jobId: id,
        status: JobStatus.FAILED,
        cancelledAt: new Date().toISOString(),
        reason: reason || 'User requested cancellation'
      }
    } as APIResponse);
  } catch (error) {
    logger.error('Error cancelling job:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cancel job'
    } as APIResponse);
  }
});

/**
 * POST /api/jobs/:id/retry
 * Retry a failed job
 */
router.post('/:id/retry', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
        message: 'Job ID is required'
      } as APIResponse);
    }

    // Mock response - replace with actual job retry logic
    const mockResponse = {
      originalJobId: id,
      newJobId: `job_retry_${Date.now()}`,
      status: JobStatus.WAITING,
      retryCount: 1,
      scheduledAt: new Date().toISOString()
    };

    logger.info(`Job retry requested: ${id}`);

    return res.status(200).json({
      success: true,
      message: "Job retry initiated successfully",
      data: mockResponse
    } as APIResponse);
  } catch (error) {
    logger.error('Error retrying job:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retry job'
    } as APIResponse);
  }
});

/**
 * GET /api/jobs/queue/:queueName
 * Get specific queue information
 */
router.get('/queue/:queueName', (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid queue name',
        message: 'Queue name is required'
      } as APIResponse);
    }

    // Mock queue data - replace with actual queue inspection
    const queueInfo = {
      name: queueName,
      status: 'active',
      jobs: {
        waiting: Math.floor(Math.random() * 5),
        active: Math.floor(Math.random() * 3),
        completed: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 10),
        delayed: Math.floor(Math.random() * 2)
      },
      workers: {
        active: 2,
        total: 3
      },
      settings: {
        concurrency: 3,
        maxRetries: 3,
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3
        }
      },
      lastActivity: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: `Queue information retrieved for ${queueName}`,
      data: queueInfo
    } as APIResponse);
  } catch (error) {
    logger.error('Error retrieving queue information:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve queue information'
    } as APIResponse);
  }
});

/**
 * POST /api/jobs/queue/:queueName/pause
 * Pause a specific queue
 */
router.post('/queue/:queueName/pause', (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid queue name',
        message: 'Queue name is required'
      } as APIResponse);
    }

    logger.info(`Queue pause requested: ${queueName}`);

    return res.status(200).json({
      success: true,
      message: `Queue ${queueName} paused successfully`,
      data: {
        queueName,
        status: 'paused',
        pausedAt: new Date().toISOString()
      }
    } as APIResponse);
  } catch (error) {
    logger.error('Error pausing queue:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to pause queue'
    } as APIResponse);
  }
});

/**
 * POST /api/jobs/queue/:queueName/resume
 * Resume a paused queue
 */
router.post('/queue/:queueName/resume', (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid queue name',
        message: 'Queue name is required'
      } as APIResponse);
    }

    logger.info(`Queue resume requested: ${queueName}`);

    return res.status(200).json({
      success: true,
      message: `Queue ${queueName} resumed successfully`,
      data: {
        queueName,
        status: 'active',
        resumedAt: new Date().toISOString()
      }
    } as APIResponse);
  } catch (error) {
    logger.error('Error resuming queue:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to resume queue'
    } as APIResponse);
  }
});

export default router;
