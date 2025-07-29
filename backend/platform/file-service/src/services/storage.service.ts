import * as Minio from 'minio';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import { logger } from '@ultramarket/shared';

export interface UploadOptions {
  bucket?: string;
  prefix?: string;
  generateThumbnails?: boolean;
  thumbnailSizes?: Array<{ width: number; height: number; suffix: string }>;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  originalName: string;
  fileName: string;
  url: string;
  thumbnails?: Array<{
    size: string;
    url: string;
    width: number;
    height: number;
  }>;
  metadata: {
    size: number;
    contentType: string;
    uploadedAt: string;
    bucket: string;
    key: string;
  };
  error?: string;
}

export interface FileInfo {
  fileId: string;
  originalName: string;
  fileName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  bucket: string;
  key: string;
  url: string;
  thumbnails?: Array<{
    size: string;
    url: string;
    width: number;
    height: number;
  }>;
  metadata?: Record<string, string>;
}

export class StorageService {
  private minioClient: Minio.Client;
  private defaultBucket: string;
  private baseUrl: string;
  private cdnUrl?: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
    const accessKey = process.env.MINIO_ROOT_USER || 'ultramarket_admin';
    const secretKey = process.env.MINIO_ROOT_PASSWORD || 'minio_secure_password';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    this.minioClient = new Minio.Client({
      endPoint: endpoint.split(':')[0],
      port: parseInt(endpoint.split(':')[1]) || (useSSL ? 443 : 9000),
      useSSL,
      accessKey,
      secretKey,
    });

    this.defaultBucket = process.env.MINIO_BUCKET_NAME || 'ultramarket-files';
    this.baseUrl = `${useSSL ? 'https' : 'http'}://${endpoint}`;
    this.cdnUrl = process.env.CDN_URL;

    this.initializeBuckets();
  }

  /**
   * Initialize required buckets
   */
  private async initializeBuckets(): Promise<void> {
    try {
      const buckets = [
        this.defaultBucket,
        'ultramarket-images',
        'ultramarket-documents',
        'ultramarket-backups',
      ];

      for (const bucket of buckets) {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket, 'us-east-1');
          logger.info('Bucket created', { bucket });

          // Set bucket policy for public read access for images
          if (bucket === 'ultramarket-images') {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucket}/*`],
                },
              ],
            };
            await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          }
        }
      }

      logger.info('MinIO buckets initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MinIO buckets', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const fileId = this.generateFileId();
      const extension = path.extname(originalName).toLowerCase();
      const fileName = `${fileId}${extension}`;

      const {
        bucket = this.getBucketByFileType(extension),
        prefix = this.getPrefixByFileType(extension),
        generateThumbnails = this.isImageFile(extension),
        thumbnailSizes = [
          { width: 150, height: 150, suffix: 'thumb' },
          { width: 300, height: 300, suffix: 'small' },
          { width: 800, height: 600, suffix: 'medium' },
        ],
        contentType = this.getContentType(extension),
        metadata = {},
      } = options;

      const key = prefix ? `${prefix}/${fileName}` : fileName;

      // Validate file
      const validation = await this.validateFile(buffer, extension);
      if (!validation.valid) {
        return {
          success: false,
          fileId,
          originalName,
          fileName,
          url: '',
          metadata: {
            size: buffer.length,
            contentType,
            uploadedAt: new Date().toISOString(),
            bucket,
            key,
          },
          error: validation.error,
        };
      }

      // Process image if needed
      let processedBuffer = buffer;
      if (this.isImageFile(extension)) {
        processedBuffer = await this.processImage(buffer);
      }

      // Upload main file
      const uploadMetadata = {
        ...metadata,
        'original-name': originalName,
        'file-id': fileId,
        'uploaded-at': new Date().toISOString(),
      };

      await this.minioClient.putObject(bucket, key, processedBuffer, processedBuffer.length, {
        'Content-Type': contentType,
        ...uploadMetadata,
      });

      const url = this.getFileUrl(bucket, key);

      const result: UploadResult = {
        success: true,
        fileId,
        originalName,
        fileName,
        url,
        metadata: {
          size: processedBuffer.length,
          contentType,
          uploadedAt: new Date().toISOString(),
          bucket,
          key,
        },
      };

      // Generate thumbnails if requested
      if (generateThumbnails && this.isImageFile(extension)) {
        try {
          const thumbnails = await this.generateThumbnails(
            buffer,
            fileId,
            extension,
            bucket,
            prefix,
            thumbnailSizes
          );
          result.thumbnails = thumbnails;
        } catch (thumbnailError) {
          logger.error('Thumbnail generation failed', {
            error: thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error',
            fileId,
          });
          // Continue without thumbnails
        }
      }

      logger.info('File uploaded successfully', {
        fileId,
        originalName,
        size: processedBuffer.length,
        bucket,
        key,
      });

      return result;
    } catch (error) {
      logger.error('File upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalName,
      });

      return {
        success: false,
        fileId: '',
        originalName,
        fileName: '',
        url: '',
        metadata: {
          size: buffer.length,
          contentType: options.contentType || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          bucket: options.bucket || this.defaultBucket,
          key: '',
        },
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    try {
      // Search for file across buckets
      const buckets = ['ultramarket-images', 'ultramarket-documents', this.defaultBucket];

      for (const bucket of buckets) {
        try {
          const objects = this.minioClient.listObjects(bucket, '', true);

          for await (const obj of objects) {
            if (obj.name?.includes(fileId)) {
              const stat = await this.minioClient.statObject(bucket, obj.name);
              const url = this.getFileUrl(bucket, obj.name);

              const fileInfo: FileInfo = {
                fileId,
                originalName: stat.metaData?.['original-name'] || obj.name || '',
                fileName: obj.name || '',
                size: stat.size || 0,
                contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
                uploadedAt:
                  stat.metaData?.['uploaded-at'] || stat.lastModified?.toISOString() || '',
                bucket,
                key: obj.name || '',
                url,
                metadata: stat.metaData,
              };

              // Get thumbnails if they exist
              if (this.isImageFile(path.extname(obj.name || ''))) {
                fileInfo.thumbnails = await this.getThumbnails(fileId, bucket);
              }

              return fileInfo;
            }
          }
        } catch (bucketError) {
          // Continue searching in other buckets
          continue;
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to get file info', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId,
      });
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(fileId);
      if (!fileInfo) {
        logger.warn('File not found for deletion', { fileId });
        return false;
      }

      // Delete main file
      await this.minioClient.removeObject(fileInfo.bucket, fileInfo.key);

      // Delete thumbnails if they exist
      if (fileInfo.thumbnails) {
        for (const thumbnail of fileInfo.thumbnails) {
          try {
            const thumbnailKey = this.getThumbnailKey(
              fileId,
              thumbnail.size,
              path.extname(fileInfo.key)
            );
            await this.minioClient.removeObject(fileInfo.bucket, thumbnailKey);
          } catch (thumbnailError) {
            logger.warn('Failed to delete thumbnail', {
              fileId,
              thumbnailSize: thumbnail.size,
            });
          }
        }
      }

      logger.info('File deleted successfully', {
        fileId,
        bucket: fileInfo.bucket,
        key: fileInfo.key,
      });

      return true;
    } catch (error) {
      logger.error('File deletion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId,
      });
      return false;
    }
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const fileInfo = await this.getFileInfo(fileId);
      if (!fileInfo) {
        return null;
      }

      const url = await this.minioClient.presignedGetObject(
        fileInfo.bucket,
        fileInfo.key,
        expiresIn
      );

      return url;
    } catch (error) {
      logger.error('Failed to generate download URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId,
      });
      return null;
    }
  }

  /**
   * Get upload URL for direct client upload
   */
  async getUploadUrl(
    fileName: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{
    uploadUrl: string;
    fileId: string;
    key: string;
  } | null> {
    try {
      const fileId = this.generateFileId();
      const extension = path.extname(fileName).toLowerCase();
      const bucket = this.getBucketByFileType(extension);
      const prefix = this.getPrefixByFileType(extension);
      const key = prefix ? `${prefix}/${fileId}${extension}` : `${fileId}${extension}`;

      const uploadUrl = await this.minioClient.presignedPutObject(bucket, key, expiresIn);

      return {
        uploadUrl,
        fileId,
        key,
      };
    } catch (error) {
      logger.error('Failed to generate upload URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      return null;
    }
  }

  /**
   * List files with pagination
   */
  async listFiles(
    bucket?: string,
    prefix?: string,
    limit: number = 50,
    marker?: string
  ): Promise<{
    files: FileInfo[];
    nextMarker?: string;
    hasMore: boolean;
  }> {
    try {
      const targetBucket = bucket || this.defaultBucket;
      const files: FileInfo[] = [];
      let count = 0;
      let lastKey = '';

      const objects = this.minioClient.listObjects(targetBucket, prefix || '', true);

      for await (const obj of objects) {
        if (marker && obj.name && obj.name <= marker) {
          continue;
        }

        if (count >= limit) {
          break;
        }

        if (obj.name) {
          try {
            const stat = await this.minioClient.statObject(targetBucket, obj.name);
            const fileId =
              stat.metaData?.['file-id'] || path.basename(obj.name, path.extname(obj.name));
            const url = this.getFileUrl(targetBucket, obj.name);

            files.push({
              fileId,
              originalName: stat.metaData?.['original-name'] || obj.name,
              fileName: obj.name,
              size: stat.size || 0,
              contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
              uploadedAt: stat.metaData?.['uploaded-at'] || stat.lastModified?.toISOString() || '',
              bucket: targetBucket,
              key: obj.name,
              url,
              metadata: stat.metaData,
            });

            lastKey = obj.name;
            count++;
          } catch (statError) {
            // Skip files that can't be accessed
            continue;
          }
        }
      }

      return {
        files,
        nextMarker: count >= limit ? lastKey : undefined,
        hasMore: count >= limit,
      };
    } catch (error) {
      logger.error('Failed to list files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bucket,
        prefix,
      });
      return {
        files: [],
        hasMore: false,
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    buckets: Array<{
      name: string;
      files: number;
      size: number;
    }>;
  }> {
    try {
      const buckets = await this.minioClient.listBuckets();
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        buckets: [] as Array<{ name: string; files: number; size: number }>,
      };

      for (const bucket of buckets) {
        let bucketFiles = 0;
        let bucketSize = 0;

        try {
          const objects = this.minioClient.listObjects(bucket.name, '', true);

          for await (const obj of objects) {
            if (obj.size) {
              bucketFiles++;
              bucketSize += obj.size;
            }
          }
        } catch (bucketError) {
          logger.warn('Failed to get stats for bucket', {
            bucket: bucket.name,
            error: bucketError instanceof Error ? bucketError.message : 'Unknown error',
          });
        }

        stats.buckets.push({
          name: bucket.name,
          files: bucketFiles,
          size: bucketSize,
        });

        stats.totalFiles += bucketFiles;
        stats.totalSize += bucketSize;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        totalFiles: 0,
        totalSize: 0,
        buckets: [],
      };
    }
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get bucket by file type
   */
  private getBucketByFileType(extension: string): string {
    if (this.isImageFile(extension)) {
      return 'ultramarket-images';
    }
    if (this.isDocumentFile(extension)) {
      return 'ultramarket-documents';
    }
    return this.defaultBucket;
  }

  /**
   * Get prefix by file type
   */
  private getPrefixByFileType(extension: string): string {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    if (this.isImageFile(extension)) {
      return `images/${year}/${month}`;
    }
    if (this.isDocumentFile(extension)) {
      return `documents/${year}/${month}`;
    }
    return `files/${year}/${month}`;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(extension: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  /**
   * Check if file is a document
   */
  private isDocumentFile(extension: string): boolean {
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    return documentExtensions.includes(extension.toLowerCase());
  }

  /**
   * Get content type by extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate file
   */
  private async validateFile(
    buffer: Buffer,
    extension: string
  ): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Check file size (max 10MB for images, 50MB for documents)
    const maxSize = this.isImageFile(extension) ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // Check for malicious content (basic check)
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    if (content.includes('<script>') || content.includes('javascript:')) {
      return {
        valid: false,
        error: 'File contains potentially malicious content',
      };
    }

    return { valid: true };
  }

  /**
   * Process image (optimize)
   */
  private async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .png({ compressionLevel: 8 })
        .toBuffer();
    } catch (error) {
      logger.warn('Image processing failed, using original', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return buffer;
    }
  }

  /**
   * Generate thumbnails
   */
  private async generateThumbnails(
    buffer: Buffer,
    fileId: string,
    extension: string,
    bucket: string,
    prefix?: string,
    sizes: Array<{ width: number; height: number; suffix: string }> = []
  ): Promise<Array<{ size: string; url: string; width: number; height: number }>> {
    const thumbnails: Array<{ size: string; url: string; width: number; height: number }> = [];

    for (const size of sizes) {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailKey = this.getThumbnailKey(fileId, size.suffix, extension, prefix);

        await this.minioClient.putObject(
          bucket,
          thumbnailKey,
          thumbnailBuffer,
          thumbnailBuffer.length,
          {
            'Content-Type': 'image/jpeg',
            'thumbnail-of': fileId,
            'thumbnail-size': size.suffix,
          }
        );

        thumbnails.push({
          size: size.suffix,
          url: this.getFileUrl(bucket, thumbnailKey),
          width: size.width,
          height: size.height,
        });
      } catch (error) {
        logger.error('Thumbnail generation failed for size', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileId,
          size: size.suffix,
        });
      }
    }

    return thumbnails;
  }

  /**
   * Get thumbnail key
   */
  private getThumbnailKey(
    fileId: string,
    size: string,
    extension: string,
    prefix?: string
  ): string {
    const thumbnailName = `${fileId}_${size}${extension}`;
    return prefix ? `${prefix}/thumbnails/${thumbnailName}` : `thumbnails/${thumbnailName}`;
  }

  /**
   * Get thumbnails for a file
   */
  private async getThumbnails(
    fileId: string,
    bucket: string
  ): Promise<
    Array<{
      size: string;
      url: string;
      width: number;
      height: number;
    }>
  > {
    try {
      const thumbnails: Array<{ size: string; url: string; width: number; height: number }> = [];
      const objects = this.minioClient.listObjects(bucket, '', true);

      for await (const obj of objects) {
        if (obj.name?.includes(`${fileId}_`) && obj.name.includes('thumbnails/')) {
          try {
            const stat = await this.minioClient.statObject(bucket, obj.name);
            const thumbnailSize = stat.metaData?.['thumbnail-size'] || 'unknown';

            // Extract dimensions from thumbnail size or use defaults
            const sizeMap: Record<string, { width: number; height: number }> = {
              thumb: { width: 150, height: 150 },
              small: { width: 300, height: 300 },
              medium: { width: 800, height: 600 },
            };

            const dimensions = sizeMap[thumbnailSize] || { width: 150, height: 150 };

            thumbnails.push({
              size: thumbnailSize,
              url: this.getFileUrl(bucket, obj.name),
              ...dimensions,
            });
          } catch (statError) {
            continue;
          }
        }
      }

      return thumbnails;
    } catch (error) {
      logger.error('Failed to get thumbnails', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId,
      });
      return [];
    }
  }

  /**
   * Get file URL
   */
  private getFileUrl(bucket: string, key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${bucket}/${key}`;
    }
    return `${this.baseUrl}/${bucket}/${key}`;
  }
}
