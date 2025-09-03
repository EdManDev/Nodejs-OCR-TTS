export interface StorageProvider {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string>;
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
}

export interface StorageConfig {
  type: 'local' | 's3';
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string;
  };
}