import { Prisma, LogLevel } from '@prisma/client';
import { prisma } from './index';

export class SystemLogModel {
  static async create(data: Prisma.SystemLogCreateInput) {
    return prisma.systemLog.create({
      data,
    });
  }

  static async findById(id: string) {
    return prisma.systemLog.findUnique({
      where: { id },
    });
  }

  static async findMany(
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.SystemLogWhereInput;
      orderBy?: Prisma.SystemLogOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 100, where, orderBy } = options;
    
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { timestamp: 'desc' },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: skip + take < total,
    };
  }

  static async findByLevel(
    level: LogLevel,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.SystemLogOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 100, orderBy } = options;
    
    return this.findMany({
      skip,
      take,
      where: { level },
      orderBy,
    });
  }

  static async findByService(
    service: string,
    options: {
      skip?: number;
      take?: number;
      level?: LogLevel;
      orderBy?: Prisma.SystemLogOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 100, level, orderBy } = options;
    
    const where: Prisma.SystemLogWhereInput = {
      service,
      ...(level && { level }),
    };

    return this.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  static async findByRequestId(requestId: string) {
    return prisma.systemLog.findMany({
      where: { requestId },
      orderBy: { timestamp: 'asc' },
    });
  }

  static async findByDateRange(
    startDate: Date,
    endDate: Date,
    options: {
      level?: LogLevel;
      service?: string;
      skip?: number;
      take?: number;
    } = {}
  ) {
    const { level, service, skip = 0, take = 100 } = options;
    
    const where: Prisma.SystemLogWhereInput = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      ...(level && { level }),
      ...(service && { service }),
    };

    return this.findMany({
      skip,
      take,
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  static async search(
    query: string,
    options: {
      level?: LogLevel;
      service?: string;
      skip?: number;
      take?: number;
    } = {}
  ) {
    const { level, service, skip = 0, take = 100 } = options;
    
    const where: Prisma.SystemLogWhereInput = {
      message: { contains: query, mode: 'insensitive' },
      ...(level && { level }),
      ...(service && { service }),
    };

    return this.findMany({
      skip,
      take,
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getRecentErrors(
    minutes: number = 60,
    options: {
      service?: string;
      take?: number;
    } = {}
  ) {
    const { service, take = 50 } = options;
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - minutes);

    const where: Prisma.SystemLogWhereInput = {
      level: LogLevel.ERROR,
      timestamp: { gte: cutoffDate },
      ...(service && { service }),
    };

    return prisma.systemLog.findMany({
      where,
      take,
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getLogStats(
    options: {
      service?: string;
      hours?: number;
    } = {}
  ) {
    const { service, hours = 24 } = options;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const where: Prisma.SystemLogWhereInput = {
      timestamp: { gte: cutoffDate },
      ...(service && { service }),
    };

    const [total, levelCounts, serviceCounts] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.groupBy({
        by: ['level'],
        where,
        _count: true,
      }),
      prisma.systemLog.groupBy({
        by: ['service'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byLevel: levelCounts.reduce((acc, item) => {
        acc[item.level] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byService: serviceCounts.reduce((acc, item) => {
        acc[item.service || 'unknown'] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  static async cleanupOldLogs(
    olderThanDays: number = 30,
    levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO]
  ) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return prisma.systemLog.deleteMany({
      where: {
        level: { in: levels },
        timestamp: { lt: cutoffDate },
      },
    });
  }

  static async getErrorTrends(hours: number = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const logs = await prisma.systemLog.findMany({
      where: {
        level: LogLevel.ERROR,
        timestamp: { gte: cutoffDate },
      },
      select: {
        timestamp: true,
        service: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by hour
    const hourlyErrors = new Map<string, number>();
    logs.forEach(log => {
      const hour = log.timestamp.toISOString().substring(0, 13);
      hourlyErrors.set(hour, (hourlyErrors.get(hour) || 0) + 1);
    });

    return Array.from(hourlyErrors.entries()).map(([hour, count]) => ({
      hour,
      errors: count,
    }));
  }

  static async log(
    level: LogLevel,
    message: string,
    options: {
      service?: string;
      requestId?: string;
      metadata?: any;
    } = {}
  ) {
    const { service, requestId, metadata } = options;
    
    return this.create({
      level,
      message,
      service,
      requestId,
      metadata: metadata || {},
    });
  }
}