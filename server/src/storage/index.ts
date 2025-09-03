import { StorageProvider, StorageConfig } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import logger from '../utils/logger';

let storageProvider: StorageProvider;

export const initializeStorage = (config: StorageConfig): StorageProvider => {
  try {
    if (config.type === 'local') {
      if (!config.local) {
        throw new Error('Local storage configuration is required');
      }
      
      storageProvider = new LocalStorageProvider(
        config.local.uploadDir,
        config.local.baseUrl
      );
      
      logger.info('Local storage provider initialized', {
        uploadDir: config.local.uploadDir,
        baseUrl: config.local.baseUrl,
      });
    } else if (config.type === 's3') {
      if (!config.s3) {
        throw new Error('S3 storage configuration is required');
      }
      
      storageProvider = new S3StorageProvider(config.s3);
      
      logger.info('S3 storage provider initialized', {
        region: config.s3.region,
        bucket: config.s3.bucket,
        endpoint: config.s3.endpoint,
      });
    } else {
      throw new Error(`Unsupported storage type: ${config.type}`);
    }
    
    return storageProvider;
  } catch (error) {
    logger.error('Failed to initialize storage provider', error);
    throw error;
  }
};

export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    throw new Error('Storage provider not initialized');
  }
  return storageProvider;
};

export { StorageProvider, StorageConfig, LocalStorageProvider, S3StorageProvider };