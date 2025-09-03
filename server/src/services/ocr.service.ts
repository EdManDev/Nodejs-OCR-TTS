import { createWorker, Worker } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import type { WriteImageResponse } from 'pdf2pic/dist/types/writeImageResponse';
import { promises as fs } from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

export interface OCRResult {
  text: string;
  confidence: number;
  pageNumber: number;
  wordDetails?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface OCROptions {
  language?: string;
  preserveInterwordSpaces?: boolean;
  rectangles?: Array<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
}

export class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker(): Promise<void> {
    try {
      this.worker = await createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug('OCR Progress', {
              progress: m.progress,
              status: m.status,
            });
          }
        },
      });

      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      this.isInitialized = true;
      
      logger.info('OCR service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OCR service', error);
      throw error;
    }
  }

  async processDocument(filePath: string, options: OCROptions = {}): Promise<OCRResult[]> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('OCR service not initialized');
    }

    try {
      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.pdf') {
        return this.processPDF(filePath, options);
      } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'].includes(fileExt)) {
        return this.processImage(filePath, options);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }
    } catch (error) {
      logger.error('Failed to process document', { filePath, error });
      throw error;
    }
  }

  private async processPDF(filePath: string, options: OCROptions = {}): Promise<OCRResult[]> {
    const tempDir = path.join(process.cwd(), 'temp', 'ocr');
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Convert PDF to images
      const convert = fromPath(filePath, {
        density: 300,
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 2000,
        height: 2000,
      });

      const results: OCRResult[] = [];
      let pageNumber = 1;

      // Process each page
      while (true) {
        try {
          const convertResult = await convert(pageNumber) as WriteImageResponse;
          
          // Ensure the result has a valid path
          if (!convertResult?.path) {
            logger.warn('PDF conversion returned no path', { pageNumber, filePath });
            break;
          }

          const imagePath = convertResult.path;

          const ocrResult = await this.processImage(imagePath, options, pageNumber);
          results.push(...ocrResult);

          // Clean up temporary image
          await fs.unlink(imagePath);

          pageNumber++;
        } catch (error) {
          // No more pages to process or conversion error
          logger.debug('PDF processing completed or failed', { pageNumber, error });
          break;
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to process PDF', { filePath, error });
      throw error;
    } finally {
      // Clean up temporary directory
      try {
        await fs.rmdir(tempDir, { recursive: true });
      } catch (error) {
        logger.warn('Failed to clean up temp directory', error);
      }
    }
  }

  private async processImage(
    imagePath: string, 
    options: OCROptions = {},
    pageNumber: number = 1
  ): Promise<OCRResult[]> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const startTime = Date.now();
      
      // Configure OCR options
      if (options.language && options.language !== 'eng') {
        await this.worker.loadLanguage(options.language);
        await this.worker.initialize(options.language);
      }

      // Perform OCR
      const { data } = await this.worker.recognize(imagePath, {
        rectangle: options.rectangles?.[0],
      });

      // Validate OCR data
      if (!data) {
        throw new Error('OCR recognition returned no data');
      }

      const processingTime = Date.now() - startTime;

      logger.info('OCR completed for image', {
        imagePath,
        pageNumber,
        confidence: data.confidence ?? 0,
        processingTime,
        textLength: data.text?.length ?? 0,
      });

      // Extract word details if available
      const wordDetails = data.words?.map(word => ({
        text: word.text || '',
        confidence: word.confidence || 0,
        bbox: {
          x0: word.bbox?.x0 || 0,
          y0: word.bbox?.y0 || 0,
          x1: word.bbox?.x1 || 0,
          y1: word.bbox?.y1 || 0,
        },
      }));

      return [{
        text: (data.text || '').trim(),
        confidence: data.confidence || 0,
        pageNumber,
        wordDetails,
      }];
    } catch (error) {
      logger.error('Failed to process image', { imagePath, pageNumber, error });
      throw error;
    }
  }

  async extractTextFromBuffer(
    buffer: Buffer,
    mimeType: string,
    options: OCROptions = {}
  ): Promise<OCRResult[]> {
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid buffer provided');
    }

    const tempDir = path.join(process.cwd(), 'temp', 'ocr');
    await fs.mkdir(tempDir, { recursive: true });

    const tempFile = path.join(tempDir, `temp_${Date.now()}.${this.getFileExtension(mimeType)}`);

    try {
      await fs.writeFile(tempFile, buffer);
      return await this.processDocument(tempFile, options);
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        logger.warn('Failed to clean up temp file', { tempFile, error });
      }
    }
  }

  private getFileExtension(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/bmp':
        return 'bmp';
      case 'image/tiff':
        return 'tiff';
      case 'image/webp':
        return 'webp';
      default:
        return 'pdf';
    }
  }

  async getConfidenceScore(text: string): Promise<number> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return 0;
    }

    // Simple confidence scoring based on text characteristics
    let score = 100;

    // Penalize for non-alphabetic characters
    const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    score *= alphaRatio;

    // Penalize for very short text
    if (text.length < 10) {
      score *= 0.5;
    }

    // Penalize for excessive special characters
    const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      score *= 0.7;
    }

    return Math.max(0, Math.min(100, score));
  }

  async detectLanguage(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return 'eng'; // Default to English for empty text
    }

    // Simple language detection based on character patterns
    const patterns = {
      eng: /[a-zA-Z]/,
      spa: /[ñáéíóúüÑÁÉÍÓÚÜ]/,
      fra: /[àâäæçéèêëïîôöœùûüÿÀÂÄÆÇÉÈÊËÏÎÔÖŒÙÛÜŸ]/,
      deu: /[äöüßÄÖÜ]/,
      ita: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'eng'; // Default to English
  }

  async enhanceText(text: string): Promise<string> {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Basic text enhancement
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper sentence spacing
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .trim();
  }

  async validateOCRResult(result: OCRResult): Promise<boolean> {
    if (!result || typeof result !== 'object') {
      return false;
    }

    // Validate OCR result quality
    if (typeof result.confidence !== 'number' || result.confidence < 30) {
      return false;
    }

    if (!result.text || typeof result.text !== 'string' || result.text.length < 5) {
      return false;
    }

    // Check for reasonable character distribution
    const alphaRatio = (result.text.match(/[a-zA-Z]/g) || []).length / result.text.length;
    if (alphaRatio < 0.5) {
      return false;
    }

    return true;
  }

  async destroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      logger.info('OCR service destroyed');
    }
  }

  // Static method to create a temporary OCR instance
  static async createTemporaryWorker(): Promise<OCRService> {
    try {
      const service = new OCRService();
      // Wait for initialization to complete
      while (!service.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return service;
    } catch (error) {
      logger.error('Failed to create temporary OCR worker', error);
      throw error;
    }
  }
}