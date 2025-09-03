import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { StorageProvider } from './StorageProvider';
import logger from '../utils/logger';

export class S3StorageProvider implements StorageProvider {
  private s3: AWS.S3;
  private bucket: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string;
  }) {
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
      endpoint: config.endpoint,
      s3ForcePathStyle: !!config.endpoint, // Required for localstack/minio
    });
    this.bucket = config.bucket;
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
      const fileExtension = path.extname(filename);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const key = `uploads/${uniqueFilename}`;
      
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
        ContentDisposition: `attachment; filename="${filename}"`,
        Metadata: {
          originalName: filename,
          uploadedAt: new Date().toISOString(),
        },
      };
      
      await this.s3.upload(params).promise();
      
      logger.info('File uploaded to S3 successfully', {
        originalName: filename,
        key,
        size: file.length,
        mimeType,
      });
      
      return key;
    } catch (error) {
      logger.error('Failed to upload file to S3', error);
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      
      const result = await this.s3.getObject(params).promise();
      
      if (!result.Body) {
        throw new Error('File not found');
      }
      
      const buffer = Buffer.isBuffer(result.Body) 
        ? result.Body 
        : Buffer.from(result.Body as string);
      
      logger.debug('File downloaded from S3 successfully', {
        key,
        size: buffer.length,
      });
      
      return buffer;
    } catch (error) {
      logger.error('Failed to download file from S3', { key, error });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      
      await this.s3.deleteObject(params).promise();
      
      logger.info('File deleted from S3 successfully', { key });
    } catch (error) {
      logger.error('Failed to delete file from S3', { key, error });
      throw error;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      
      // Generate a presigned URL valid for 1 hour
      const url = this.s3.getSignedUrl('getObject', {
        ...params,
        Expires: 3600, // 1 hour
      });
      
      return url;
    } catch (error) {
      logger.error('Failed to generate file URL', { key, error });
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if ((error as AWS.AWSError).statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: Record<string, string>;
  }> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      
      const result = await this.s3.headObject(params).promise();
      
      return {
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType || 'application/octet-stream',
        metadata: result.Metadata || {},
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { key, error });
      throw error;
    }
  }

  async listFiles(prefix: string = 'uploads/'): Promise<string[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents?.map(obj => obj.Key!) || [];
    } catch (error) {
      logger.error('Failed to list files', { prefix, error });
      throw error;
    }
  }

  async cleanupOldFiles(olderThanDays: number, prefix: string = 'uploads/'): Promise<number> {
    try {
      const files = await this.listFiles(prefix);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let deletedCount = 0;
      
      for (const key of files) {
        const metadata = await this.getFileMetadata(key);
        
        if (metadata.lastModified < cutoffDate) {
          await this.deleteFile(key);
          deletedCount++;
        }
      }
      
      logger.info('S3 cleanup completed', { deletedCount, olderThanDays });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files from S3', error);
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const params: AWS.S3.CopyObjectRequest = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      };
      
      await this.s3.copyObject(params).promise();
      
      logger.info('File copied in S3 successfully', {
        sourceKey,
        destinationKey,
      });
    } catch (error) {
      logger.error('Failed to copy file in S3', { sourceKey, destinationKey, error });
      throw error;
    }
  }
}