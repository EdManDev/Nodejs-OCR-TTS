import { Prisma, ProcessingStatus } from '@prisma/client';
import { prisma } from './index';

export class DocumentModel {
  static async create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({
      data,
      include: {
        textChunks: true,
        processingJobs: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        textChunks: {
          orderBy: { chunkIndex: 'asc' },
        },
        processingJobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async findMany(
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.DocumentWhereInput;
      orderBy?: Prisma.DocumentOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 20, where, orderBy } = options;
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { uploadedAt: 'desc' },
        include: {
          textChunks: {
            take: 1,
            orderBy: { chunkIndex: 'asc' },
          },
          processingJobs: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
      total,
      hasMore: skip + take < total,
    };
  }

  static async update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({
      where: { id },
      data,
      include: {
        textChunks: true,
        processingJobs: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.document.delete({
      where: { id },
    });
  }

  static async updateStatus(id: string, status: ProcessingStatus) {
    return prisma.document.update({
      where: { id },
      data: { 
        status,
        processedAt: status === ProcessingStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  static async search(query: string, options: { skip?: number; take?: number } = {}) {
    const { skip = 0, take = 20 } = options;
    
    const searchWhere: Prisma.DocumentWhereInput = {
      OR: [
        { originalName: { contains: query, mode: 'insensitive' } },
        { extractedText: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { author: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        skip,
        take,
        where: searchWhere,
        orderBy: { uploadedAt: 'desc' },
        include: {
          textChunks: {
            take: 1,
            orderBy: { chunkIndex: 'asc' },
          },
          processingJobs: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.document.count({ where: searchWhere }),
    ]);

    return {
      documents,
      total,
      hasMore: skip + take < total,
    };
  }

  static async getStats() {
    const [total, statusCounts, recentActivity] = await Promise.all([
      prisma.document.count(),
      prisma.document.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.document.findMany({
        take: 30,
        orderBy: { uploadedAt: 'desc' },
        select: {
          uploadedAt: true,
          status: true,
          processingJobs: {
            select: {
              completedAt: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Calculate processing time average
    const completedJobs = recentActivity.flatMap(doc => 
      doc.processingJobs.filter(job => job.completedAt)
    );
    
    const processingTimeAverage = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const processingTime = job.completedAt!.getTime() - new Date(job.completedAt!).getTime();
          return sum + processingTime;
        }, 0) / completedJobs.length
      : 0;

    // Success rate
    const completedDocs = statusCounts.find(s => s.status === ProcessingStatus.COMPLETED)?._count || 0;
    const failedDocs = statusCounts.find(s => s.status === ProcessingStatus.FAILED)?._count || 0;
    const successRate = total > 0 ? (completedDocs / (completedDocs + failedDocs)) * 100 : 0;

    return {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      processingTimeAverage: processingTimeAverage / 1000, // Convert to seconds
      successRate,
      recentActivity: recentActivity.map(doc => ({
        date: doc.uploadedAt.toISOString().split('T')[0],
        uploads: 1,
        processed: doc.status === ProcessingStatus.COMPLETED ? 1 : 0,
        failed: doc.status === ProcessingStatus.FAILED ? 1 : 0,
      })),
    };
  }
}