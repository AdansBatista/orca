/**
 * Storage Service - Abstract interface for file storage
 *
 * Provides a unified interface for storing files, either locally (dev)
 * or in S3-compatible storage (production).
 */

import { LocalStorage } from './local';

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
}

export interface StorageService {
  /**
   * Upload a file to storage
   * @param file - File buffer
   * @param path - Storage path (e.g., 'clinicId/patientId/filename.jpg')
   * @param options - Upload options
   * @returns Upload result with URL and metadata
   */
  upload(
    file: Buffer,
    path: string,
    options?: {
      mimeType?: string;
      generateThumbnail?: boolean;
      thumbnailWidth?: number;
    }
  ): Promise<UploadResult>;

  /**
   * Get a URL for accessing a file
   * For local storage, returns a direct path
   * For S3, returns a pre-signed URL
   * @param path - Storage path
   * @param expiresIn - Expiration time in seconds (for signed URLs)
   */
  getUrl(path: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage
   * @param path - Storage path
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   * @param path - Storage path
   */
  exists(path: string): Promise<boolean>;
}

// Storage provider type
type StorageProvider = 'local' | 's3';

// Get storage provider from environment
const getStorageProvider = (): StorageProvider => {
  const provider = process.env.STORAGE_PROVIDER;
  if (provider === 's3') {
    return 's3';
  }
  return 'local';
};

// Singleton storage instance
let storageInstance: StorageService | null = null;

/**
 * Get the storage service instance
 * Uses local storage by default, S3 when configured
 */
export function getStorage(): StorageService {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = getStorageProvider();

  switch (provider) {
    case 's3':
      // S3 storage would be imported here when implemented
      // For now, fall back to local
      console.warn('S3 storage not yet implemented, using local storage');
      storageInstance = new LocalStorage();
      break;
    case 'local':
    default:
      storageInstance = new LocalStorage();
      break;
  }

  return storageInstance;
}
