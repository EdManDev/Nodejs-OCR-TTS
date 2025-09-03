import { Prisma, JobType, JobStatus } from '@prisma/client';
import { prisma } from './index';

export class ProcessingJobModel {
  static async create(data: Prisma.ProcessingJobCreateInput) {
    return prisma.processingJob.create({
      data,
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async findById(id: string) {
    return prisma.processingJob.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async findMany(
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.ProcessingJobWhereInput;
      orderBy?: Prisma.ProcessingJobOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 20, where, orderBy } = options;
    
    const [jobs, total] = await Promise.all([
      prisma.processingJob.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              status: true,
            },
          },
        },
      }),
      prisma.processingJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      hasMore: skip + take < total,
    };
  }

  static async findByDocumentId(documentId: string) {
    return prisma.processingJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Prisma.ProcessingJobUpdateInput) {
    return prisma.processingJob.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async updateStatus(
    id: string,
    status: JobStatus,
    options: {
      progress?: number;
      error?: string;
      metadata?: any;
    } = {}
  ) {
    const { progress, error, metadata } = options;
    
    const updateData: Prisma.ProcessingJobUpdateInput = {
      status,
      updatedAt: new Date(),
      ...(progress !== undefined && { progress }),
      ...(error !== undefined && { error }),
      ...(metadata !== undefined && { metadata }),
    };

    // Set timestamps based on status
    if (status === JobStatus.ACTIVE && !updateData.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    return prisma.processingJob.update({
      where: { id },
      data: updateData,
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return prisma.processingJob.delete({
      where: { id },
    });
  }

  static async getActiveJobs() {
    return prisma.processingJob.findMany({
      where: { status: JobStatus.ACTIVE },
      orderBy: { startedAt: 'asc' },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async getFailedJobs() {
    return prisma.processingJob.findMany({
      where: { status: JobStatus.FAILED },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async getJobsNeedingRetry() {
    return prisma.processingJob.findMany({
      where: {
        status: JobStatus.FAILED,
        // Add logic for retry attempts if needed
      },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
  }

  static async getStats() {
    const [total, statusCounts, typeCounts, recentActivity] = await Promise.all([
      prisma.processingJob.count(),
      prisma.processingJob.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.processingJob.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.processingJob.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          completedAt: true,
          startedAt: true,
          status: true,
          type: true,
        },
      }),
    ]);

    // Calculate average processing time
    const completedJobs = recentActivity.filter(job => 
      job.status === JobStatus.COMPLETED && job.startedAt && job.completedAt
    );
    
    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const processingTime = job.completedAt!.getTime() - job.startedAt!.getTime();
          return sum + processingTime;
        }, 0) / completedJobs.length
      : 0;

    // Success rate
    const completedCount = statusCounts.find(s => s.status === JobStatus.COMPLETED)?._count || 0;
    const failedCount = statusCounts.find(s => s.status === JobStatus.FAILED)?._count || 0;
    const successRate = total > 0 ? (completedCount / (completedCount + failedCount)) * 100 : 0;

    // Group activity by hour for the last 24 hours
    const now = new Date();
    const activityMap = new Map<string, { completed: number; failed: number; pending: number }>();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().substring(0, 13);
      activityMap.set(hourKey, { completed: 0, failed: 0, pending: 0 });
    }

    recentActivity.forEach(job => {
      const hourKey = job.createdAt.toISOString().substring(0, 13);
      const activity = activityMap.get(hourKey);
      if (activity) {
        if (job.status === JobStatus.COMPLETED) activity.completed++;
        else if (job.status === JobStatus.FAILED) activity.failed++;
        else activity.pending++;
      }
    });

    return {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      averageProcessingTime: averageProcessingTime / 1000, // Convert to seconds
      successRate,
      recentActivity: Array.from(activityMap.entries()).map(([hour, activity]) => ({
        hour,
        ...activity,
      })),
    };
  }
}