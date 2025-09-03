import { Prisma } from '@prisma/client';
import { prisma } from './index';

export class TextChunkModel {
  static async create(data: Prisma.TextChunkCreateInput) {
    return prisma.textChunk.create({
      data,
      include: {
        document: true,
      },
    });
  }

  static async createMany(data: Prisma.TextChunkCreateManyInput[]) {
    return prisma.textChunk.createMany({
      data,
      skipDuplicates: true,
    });
  }

  static async findById(id: string) {
    return prisma.textChunk.findUnique({
      where: { id },
      include: {
        document: true,
      },
    });
  }

  static async findByDocumentId(
    documentId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.TextChunkOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 20, orderBy } = options;
    
    const [chunks, total] = await Promise.all([
      prisma.textChunk.findMany({
        where: { documentId },
        skip,
        take,
        orderBy: orderBy || { chunkIndex: 'asc' },
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
      prisma.textChunk.count({ where: { documentId } }),
    ]);

    return {
      chunks,
      total,
      hasMore: skip + take < total,
    };
  }

  static async update(id: string, data: Prisma.TextChunkUpdateInput) {
    return prisma.textChunk.update({
      where: { id },
      data,
      include: {
        document: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.textChunk.delete({
      where: { id },
    });
  }

  static async deleteByDocumentId(documentId: string) {
    return prisma.textChunk.deleteMany({
      where: { documentId },
    });
  }

  static async getChunksByRange(
    documentId: string,
    startIndex: number,
    endIndex: number
  ) {
    return prisma.textChunk.findMany({
      where: {
        documentId,
        chunkIndex: {
          gte: startIndex,
          lte: endIndex,
        },
      },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  static async getStats(documentId?: string) {
    const where = documentId ? { documentId } : {};
    
    const [total, avgWordCount, avgCharCount, avgReadingTime] = await Promise.all([
      prisma.textChunk.count({ where }),
      prisma.textChunk.aggregate({
        where,
        _avg: { wordCount: true },
      }),
      prisma.textChunk.aggregate({
        where,
        _avg: { characterCount: true },
      }),
      prisma.textChunk.aggregate({
        where,
        _avg: { estimatedReadingTime: true },
      }),
    ]);

    return {
      total,
      averageWordCount: Math.round(avgWordCount._avg.wordCount || 0),
      averageCharacterCount: Math.round(avgCharCount._avg.characterCount || 0),
      averageReadingTime: Math.round(avgReadingTime._avg.estimatedReadingTime || 0),
    };
  }

  static async searchInChunks(
    query: string,
    options: {
      documentId?: string;
      skip?: number;
      take?: number;
    } = {}
  ) {
    const { documentId, skip = 0, take = 20 } = options;
    
    const where: Prisma.TextChunkWhereInput = {
      content: { contains: query, mode: 'insensitive' },
      ...(documentId && { documentId }),
    };

    const [chunks, total] = await Promise.all([
      prisma.textChunk.findMany({
        where,
        skip,
        take,
        orderBy: { chunkIndex: 'asc' },
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
      prisma.textChunk.count({ where }),
    ]);

    return {
      chunks,
      total,
      hasMore: skip + take < total,
    };
  }
}