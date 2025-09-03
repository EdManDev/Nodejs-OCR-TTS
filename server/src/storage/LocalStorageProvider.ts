import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from './StorageProvider';
import logger from '../utils/logger';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor(uploadDir: string, baseUrl: string) {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory', error);
      throw error;
    }
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
      const fileExtension = path.extname(filename);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);
      
      await fs.writeFile(filePath, file);
      
      logger.info('File uploaded successfully', {
        originalName: filename,
        storedName: uniqueFilename,
        size: file.length,
        mimeType,
      });
      
      return uniqueFilename;
    } catch (error) {
      logger.error('Failed to upload file', error);
      throw error;
    }
  }

  async downloadFile(filename: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const file = await fs.readFile(filePath);
      
      logger.debug('File downloaded successfully', {
        filename,
        size: file.length,
      });
      
      return file;
    } catch (error) {
      logger.error('Failed to download file', { filename, error });
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      
      logger.info('File deleted successfully', { filename });
    } catch (error) {
      logger.error('Failed to delete file', { filename, error });
      throw error;
    }
  }

  async getFileUrl(filename: string): Promise<string> {
    return `${this.baseUrl}/uploads/${filename}`;
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filename: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
  }> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      logger.error('Failed to get file stats', { filename, error });
      throw error;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      
      if (prefix) {
        return files.filter(file => file.startsWith(prefix));
      }
      
      return files;
    } catch (error) {
      logger.error('Failed to list files', error);
      throw error;
    }
  }

  async cleanupOldFiles(olderThanDays: number): Promise<number> {
    try {
      const files = await this.listFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      logger.info('Cleanup completed', { deletedCount, olderThanDays });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files', error);
      throw error;
    }
  }
}