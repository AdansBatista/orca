/**
 * Storage Service - Local filesystem storage for patient images
 *
 * This application uses local filesystem storage exclusively.
 * All files are stored in public/uploads/images/{clinicId}/{patientId}/
 * and served directly by Next.js as static files.
 *
 * This supports the on-premises deployment model where all data
 * remains on the local LAN.
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
   * Returns a direct path for static file serving
   * @param path - Storage path
   * @param expiresIn - Not used for local storage (included for interface compatibility)
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

// Singleton storage instance
let storageInstance: StorageService | null = null;

/**
 * Get the storage service instance
 * Uses local filesystem storage for on-premises deployment
 */
export function getStorage(): StorageService {
  if (!storageInstance) {
    storageInstance = new LocalStorage();
  }
  return storageInstance;
}
