import { StoragePath } from '../enums/storage-path.enum';

export interface UploadOptions {
  path: StoragePath;
  isPublic?: boolean;
  maxSize?: number; // bytes
  allowedMimeTypes?: string[];
}

export interface FileInfo {
  key: string;
  url: string;
  publicUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}
