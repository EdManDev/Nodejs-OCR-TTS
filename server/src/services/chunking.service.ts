import { TextChunkModel } from '../models/TextChunk';
import logger from '../utils/logger';

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveSentences?: boolean;
  preserveParagraphs?: boolean;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startPage: number;
  endPage: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number;
}

export class ChunkingService {
  private readonly WORDS_PER_MINUTE = 200; // Average reading speed

  async chunkText(text: string, options: ChunkOptions): Promise<TextChunk[]> {
    try {
      const {
        chunkSize,
        chunkOverlap,
        preserveSentences = true,
        preserveParagraphs = true,
      } = options;

      logger.info('Starting text chunking', {
        textLength: text.length,
        chunkSize,
        chunkOverlap,
      });

      // Pre-process text
      const processedText = this.preprocessText(text);

      // Split into chunks
      const chunks = this.splitIntoChunks(processedText, chunkSize, chunkOverlap, {
        preserveSentences,
        preserveParagraphs,
      });

      // Process each chunk
      const processedChunks = chunks.map((chunk, index) => ({
        content: chunk,
        chunkIndex: index,
        startPage: 1, // This would be calculated from page boundaries in a real implementation
        endPage: 1,
        wordCount: this.countWords(chunk),
        characterCount: chunk.length,
        estimatedReadingTime: this.calculateReadingTime(chunk),
      }));

      logger.info('Text chunking completed', {
        originalLength: text.length,
        chunkCount: processedChunks.length,
        averageChunkSize: processedChunks.reduce((sum, chunk) => sum + chunk.characterCount, 0) / processedChunks.length,
      });

      return processedChunks;
    } catch (error) {
      logger.error('Text chunking failed', error);
      throw error;
    }
  }

  private preprocessText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Normalize paragraph breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private splitIntoChunks(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    options: { preserveSentences: boolean; preserveParagraphs: boolean }
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      
      // Find a good breaking point
      if (end < text.length) {
        end = this.findBreakPoint(text, start, end, options);
      }

      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Calculate next start position with overlap
      start = Math.max(start + 1, end - chunkOverlap);
    }

    return chunks;
  }

  private findBreakPoint(
    text: string,
    start: number,
    end: number,
    options: { preserveSentences: boolean; preserveParagraphs: boolean }
  ): number {
    // Try to break at paragraph boundaries first
    if (options.preserveParagraphs) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start) {
        return paragraphBreak;
      }
    }

    // Try to break at sentence boundaries
    if (options.preserveSentences) {
      const sentenceBreak = this.findSentenceBreak(text, start, end);
      if (sentenceBreak > start) {
        return sentenceBreak;
      }
    }

    // Fall back to word boundaries
    const wordBreak = text.lastIndexOf(' ', end);
    if (wordBreak > start) {
      return wordBreak;
    }

    // If all else fails, break at the specified position
    return end;
  }

  private findSentenceBreak(text: string, start: number, end: number): number {
    // Look for sentence-ending punctuation followed by space and capital letter
    const sentencePattern = /[.!?]\s+[A-Z]/g;
    let match;
    let lastSentenceEnd = start;

    sentencePattern.lastIndex = start;
    while ((match = sentencePattern.exec(text)) !== null) {
      if (match.index > end) {
        break;
      }
      lastSentenceEnd = match.index + 1; // Position after the punctuation
    }

    return lastSentenceEnd;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(text: string): number {
    const wordCount = this.countWords(text);
    return Math.ceil((wordCount / this.WORDS_PER_MINUTE) * 60); // Return in seconds
  }

  async saveChunks(documentId: string, chunks: TextChunk[]): Promise<void> {
    try {
      // Delete existing chunks for this document
      await TextChunkModel.deleteByDocumentId(documentId);

      // Prepare chunk data for batch insert
      const chunkData = chunks.map(chunk => ({
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        startPage: chunk.startPage,
        endPage: chunk.endPage,
        wordCount: chunk.wordCount,
        characterCount: chunk.characterCount,
        estimatedReadingTime: chunk.estimatedReadingTime,
      }));

      // Batch insert chunks
      await TextChunkModel.createMany(chunkData);

      logger.info('Text chunks saved successfully', {
        documentId,
        chunkCount: chunks.length,
      });
    } catch (error) {
      logger.error('Failed to save text chunks', { documentId, error });
      throw error;
    }
  }

  async getChunks(documentId: string, options: {
    skip?: number;
    take?: number;
  } = {}): Promise<any> {
    return TextChunkModel.findByDocumentId(documentId, options);
  }

  async getChunksByRange(
    documentId: string,
    startIndex: number,
    endIndex: number
  ): Promise<any> {
    return TextChunkModel.getChunksByRange(documentId, startIndex, endIndex);
  }

  async searchInChunks(
    query: string,
    options: {
      documentId?: string;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<any> {
    return TextChunkModel.searchInChunks(query, options);
  }

  async getChunkStats(documentId?: string): Promise<any> {
    return TextChunkModel.getStats(documentId);
  }

  async optimizeChunks(documentId: string): Promise<void> {
    try {
      const chunks = await TextChunkModel.findByDocumentId(documentId);
      
      // Analyze chunk quality
      const analysis = this.analyzeChunkQuality(chunks.chunks);
      
      // If quality is poor, re-chunk with better parameters
      if (analysis.averageQuality < 0.7) {
        logger.info('Re-chunking document with optimized parameters', {
          documentId,
          currentQuality: analysis.averageQuality,
        });

        // Get original text (this would come from the document)
        // const document = await DocumentModel.findById(documentId);
        // const optimizedChunks = await this.chunkText(document.extractedText, {
        //   chunkSize: analysis.recommendedChunkSize,
        //   chunkOverlap: analysis.recommendedOverlap,
        // });
        
        // await this.saveChunks(documentId, optimizedChunks);
      }
    } catch (error) {
      logger.error('Failed to optimize chunks', { documentId, error });
      throw error;
    }
  }

  private analyzeChunkQuality(chunks: any[]): {
    averageQuality: number;
    recommendedChunkSize: number;
    recommendedOverlap: number;
  } {
    let totalQuality = 0;
    
    for (const chunk of chunks) {
      let quality = 1.0;
      
      // Penalize very short chunks
      if (chunk.wordCount < 50) {
        quality *= 0.5;
      }
      
      // Penalize very long chunks
      if (chunk.wordCount > 500) {
        quality *= 0.7;
      }
      
      // Penalize chunks with poor sentence structure
      const sentenceCount = (chunk.content.match(/[.!?]/g) || []).length;
      if (sentenceCount === 0) {
        quality *= 0.3;
      }
      
      totalQuality += quality;
    }

    const averageQuality = totalQuality / chunks.length;
    
    // Recommend chunk size based on analysis
    const avgWordCount = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0) / chunks.length;
    const recommendedChunkSize = Math.max(800, Math.min(1200, avgWordCount * 3));
    const recommendedOverlap = Math.floor(recommendedChunkSize * 0.2);

    return {
      averageQuality,
      recommendedChunkSize,
      recommendedOverlap,
    };
  }

  async mergeChunks(documentId: string, chunkIds: string[]): Promise<string> {
    try {
      const chunks = await Promise.all(
        chunkIds.map(id => TextChunkModel.findById(id))
      );

      // Sort chunks by index
      const sortedChunks = chunks
        .filter(chunk => chunk !== null)
        .sort((a, b) => a!.chunkIndex - b!.chunkIndex);

      // Merge content
      const mergedContent = sortedChunks.map(chunk => chunk!.content).join('\n\n');

      return mergedContent;
    } catch (error) {
      logger.error('Failed to merge chunks', { documentId, chunkIds, error });
      throw error;
    }
  }

  async splitChunk(chunkId: string, splitOptions: ChunkOptions): Promise<string[]> {
    try {
      const chunk = await TextChunkModel.findById(chunkId);
      if (!chunk) {
        throw new Error('Chunk not found');
      }

      const subChunks = await this.chunkText(chunk.content, splitOptions);
      
      // Save new chunks (this would need to update indices)
      // Implementation depends on your specific requirements
      
      return subChunks.map(subChunk => subChunk.content);
    } catch (error) {
      logger.error('Failed to split chunk', { chunkId, error });
      throw error;
    }
  }
}