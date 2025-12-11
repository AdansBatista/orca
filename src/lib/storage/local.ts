/**
 * Local Storage Implementation
 *
 * Stores files in the public/uploads directory for development.
 * Files are served statically by Next.js.
 */

import fs from 'fs/promises';
import path from 'path';
import type { StorageService, UploadResult } from './index';

// Base directory for uploads (relative to project root)
const UPLOAD_DIR = 'public/uploads/images';

// Thumbnail settings
const DEFAULT_THUMBNAIL_WIDTH = 300;

export class LocalStorage implements StorageService {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    // Resolve to absolute path
    this.baseDir = path.resolve(process.cwd(), UPLOAD_DIR);
    // URL prefix for accessing files
    this.baseUrl = '/uploads/images';
  }

  async upload(
    file: Buffer,
    storagePath: string,
    options?: {
      mimeType?: string;
      generateThumbnail?: boolean;
      thumbnailWidth?: number;
    }
  ): Promise<UploadResult> {
    const fullPath = path.join(this.baseDir, storagePath);
    const dirPath = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write main file
    await fs.writeFile(fullPath, file);

    // Detect mime type from extension if not provided
    const mimeType = options?.mimeType || this.getMimeType(storagePath);

    // Generate thumbnail if requested and file is an image
    let thumbnailUrl: string | undefined;
    if (options?.generateThumbnail && this.isImage(mimeType)) {
      try {
        thumbnailUrl = await this.generateThumbnail(
          file,
          storagePath,
          options.thumbnailWidth || DEFAULT_THUMBNAIL_WIDTH
        );
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Continue without thumbnail
      }
    }

    return {
      url: `${this.baseUrl}/${storagePath}`,
      thumbnailUrl,
      fileSize: file.length,
      mimeType,
    };
  }

  async getUrl(storagePath: string): Promise<string> {
    return `${this.baseUrl}/${storagePath}`;
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, storagePath);

    try {
      await fs.unlink(fullPath);

      // Also try to delete thumbnail
      const thumbnailPath = this.getThumbnailPath(storagePath);
      const fullThumbnailPath = path.join(this.baseDir, thumbnailPath);
      try {
        await fs.unlink(fullThumbnailPath);
      } catch {
        // Thumbnail might not exist
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, storagePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a thumbnail for an image
   */
  private async generateThumbnail(
    file: Buffer,
    storagePath: string,
    width: number
  ): Promise<string> {
    // Dynamic import of sharp to avoid issues when not installed
    const sharp = (await import('sharp')).default;

    const thumbnailPath = this.getThumbnailPath(storagePath);
    const fullThumbnailPath = path.join(this.baseDir, thumbnailPath);
    const dirPath = path.dirname(fullThumbnailPath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Resize and save thumbnail
    await sharp(file)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: 80 })
      .toFile(fullThumbnailPath);

    return `${this.baseUrl}/${thumbnailPath}`;
  }

  /**
   * Get thumbnail path from original path
   */
  private getThumbnailPath(storagePath: string): string {
    const ext = path.extname(storagePath);
    const basePath = storagePath.slice(0, -ext.length);
    return `${basePath}_thumb.jpg`;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.svg': 'image/svg+xml',
      '.dcm': 'application/dicom',
      '.pdf': 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if MIME type is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
}
