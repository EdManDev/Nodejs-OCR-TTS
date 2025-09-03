import { Prisma, JobStatus } from '@prisma/client';
import { prisma } from './index';

export class QueueJobModel {
  static async create(data: Prisma.QueueJobCreateInput) {
    return prisma.queueJob.create({
      data,
    });
  }

  static async findById(id: string) {
    return prisma.queueJob.findUnique({
      where: { id },
    });
  }

  static async findMany(
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.QueueJobWhereInput;
      orderBy?: Prisma.QueueJobOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 20, where, orderBy } = options;
    
    const [jobs, total] = await Promise.all([
      prisma.queueJob.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      prisma.queueJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      hasMore: skip + take < total,
    };
  }

  static async findByQueue(
    queueName: string,
    options: {
      status?: JobStatus;
      skip?: number;
      take?: number;
      orderBy?: Prisma.QueueJobOrderByWithRelationInput;
    } = {}
  ) {
    const { status, skip = 0, take = 20, orderBy } = options;
    
    const where: Prisma.QueueJobWhereInput = {
      queueName,
      ...(status && { status }),
    };

    const [jobs, total] = await Promise.all([
      prisma.queueJob.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      prisma.queueJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      hasMore: skip + take < total,
    };
  }

  static async update(id: string, data: Prisma.QueueJobUpdateInput) {
    return prisma.queueJob.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  static async updateStatus(
    id: string,
    status: JobStatus,
    options: {
      error?: string;
      attempts?: number;
    } = {}
  ) {
    const { error, attempts } = options;
    
    const updateData: Prisma.QueueJobUpdateInput = {
      status,
      updatedAt: new Date(),
      ...(error !== undefined && { error }),
      ...(attempts !== undefined && { attempts }),
    };

    // Set timestamps based on status
    if (status === JobStatus.ACTIVE) {
      updateData.processedAt = new Date();
    } else if (status === JobStatus.FAILED) {
      updateData.failedAt = new Date();
    }

    return prisma.queueJob.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    return prisma.queueJob.delete({
      where: { id },
    });
  }

  static async deleteMany(where: Prisma.QueueJobWhereInput) {
    return prisma.queueJob.deleteMany({
      where,
    });
  }

  static async getNextJob(queueName: string) {
    return prisma.queueJob.findFirst({
      where: {
        queueName,
        status: JobStatus.WAITING,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  static async getJobsForRetry(queueName: string, maxAttempts: number = 3) {
    return prisma.queueJob.findMany({
      where: {
        queueName,
        status: JobStatus.FAILED,
        attempts: {
          lt: maxAttempts,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getQueueStats() {
    const [queueCounts, totalJobs] = await Promise.all([
      prisma.queueJob.groupBy({
        by: ['queueName', 'status'],
        _count: true,
      }),
      prisma.queueJob.count(),
    ]);

    // Group by queue name
    const queueMap = new Map<string, {
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }>();

    queueCounts.forEach(({ queueName, status, _count }) => {
      if (!queueMap.has(queueName)) {
        queueMap.set(queueName, {
          name: queueName,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        });
      }
      
      const queue = queueMap.get(queueName)!;
      switch (status) {
        case JobStatus.WAITING:
          queue.waiting = _count;
          break;
        case JobStatus.ACTIVE:
          queue.active = _count;
          break;
        case JobStatus.COMPLETED:
          queue.completed = _count;
          break;
        case JobStatus.FAILED:
          queue.failed = _count;
          break;
        case JobStatus.DELAYED:
          queue.delayed = _count;
          break;
      }
    });

    return {
      queues: Array.from(queueMap.values()),
      totalJobs,
      workers: 1, // This would be dynamically calculated based on your worker setup
      throughput: 0, // This would be calculated based on recent job completion rates
    };
  }

  static async cleanupOldJobs(
    olderThanDays: number = 30,
    statuses: JobStatus[] = [JobStatus.COMPLETED, JobStatus.FAILED]
  ) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return prisma.queueJob.deleteMany({
      where: {
        status: { in: statuses },
        createdAt: { lt: cutoffDate },
      },
    });
  }

  static async getStuckJobs(stuckAfterMinutes: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - stuckAfterMinutes);

    return prisma.queueJob.findMany({
      where: {
        status: JobStatus.ACTIVE,
        processedAt: { lt: cutoffDate },
      },
      orderBy: { processedAt: 'asc' },
    });
  }
}