import { Request, Response } from 'express';
import multer from 'multer';
import { StorageService, UploadOptions } from '../services/storage.service';
import { logger } from '@ultramarket/shared';

export class FileController {
  private storageService: StorageService;
  private upload: multer.Multer;

  constructor() {
    this.storageService = new StorageService();

    // Configure multer for memory storage
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10, // Max 10 files at once
      },
      fileFilter: (req, file, cb) => {
        // Allow specific file types
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} is not allowed`));
        }
      },
    });
  }

  /**
   * Get multer middleware
   */
  getUploadMiddleware() {
    return this.upload;
  }

  /**
   * Upload single file
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided',
        });
        return;
      }

      const options: UploadOptions = {
        generateThumbnails: req.body.generateThumbnails === 'true',
        bucket: req.body.bucket,
        prefix: req.body.prefix,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      };

      const result = await this.storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        options
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result,
        });

        logger.info('File uploaded via API', {
          fileId: result.fileId,
          originalName: result.originalName,
          size: result.metadata.size,
          userId: (req as any).user?.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('File upload via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: req.file?.originalname,
      });

      res.status(500).json({
        success: false,
        error: 'File upload failed',
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files provided',
        });
        return;
      }

      const options: UploadOptions = {
        generateThumbnails: req.body.generateThumbnails === 'true',
        bucket: req.body.bucket,
        prefix: req.body.prefix,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      };

      const results = await Promise.all(
        req.files.map((file) =>
          this.storageService.uploadFile(file.buffer, file.originalname, options)
        )
      );

      const successful = results.filter((result) => result.success);
      const failed = results.filter((result) => !result.success);

      res.status(200).json({
        success: true,
        data: {
          uploaded: successful,
          failed: failed.map((result) => ({
            fileName: result.originalName,
            error: result.error,
          })),
          summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
          },
        },
      });

      logger.info('Multiple files uploaded via API', {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        userId: (req as any).user?.id,
      });
    } catch (error) {
      logger.error('Multiple files upload via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileCount: Array.isArray(req.files) ? req.files.length : 0,
      });

      res.status(500).json({
        success: false,
        error: 'Multiple files upload failed',
      });
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: 'File ID is required',
        });
        return;
      }

      const fileInfo = await this.storageService.getFileInfo(fileId);

      if (!fileInfo) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: fileInfo,
      });
    } catch (error) {
      logger.error('Get file info failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId: req.params.fileId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get file information',
      });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: 'File ID is required',
        });
        return;
      }

      const deleted = await this.storageService.deleteFile(fileId);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'File deleted successfully',
          data: { fileId },
        });

        logger.info('File deleted via API', {
          fileId,
          userId: (req as any).user?.id,
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }
    } catch (error) {
      logger.error('File deletion via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId: req.params.fileId,
      });

      res.status(500).json({
        success: false,
        error: 'File deletion failed',
      });
    }
  }

  /**
   * Get download URL
   */
  async getDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { expiresIn = '3600' } = req.query;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: 'File ID is required',
        });
        return;
      }

      const expirationTime = parseInt(expiresIn as string) || 3600;
      const downloadUrl = await this.storageService.getDownloadUrl(fileId, expirationTime);

      if (!downloadUrl) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          fileId,
          downloadUrl,
          expiresIn: expirationTime,
          expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString(),
        },
      });
    } catch (error) {
      logger.error('Get download URL failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId: req.params.fileId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL',
      });
    }
  }

  /**
   * Get upload URL for direct client upload
   */
  async getUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, contentType } = req.body;
      const { expiresIn = '3600' } = req.query;

      if (!fileName || !contentType) {
        res.status(400).json({
          success: false,
          error: 'fileName and contentType are required',
        });
        return;
      }

      const expirationTime = parseInt(expiresIn as string) || 3600;
      const uploadData = await this.storageService.getUploadUrl(
        fileName,
        contentType,
        expirationTime
      );

      if (!uploadData) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate upload URL',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...uploadData,
          expiresIn: expirationTime,
          expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString(),
        },
      });
    } catch (error) {
      logger.error('Get upload URL failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: req.body.fileName,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate upload URL',
      });
    }
  }

  /**
   * List files with pagination
   */
  async listFiles(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, prefix, limit = '50', marker } = req.query;

      const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100

      const result = await this.storageService.listFiles(
        bucket as string,
        prefix as string,
        limitNum,
        marker as string
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('List files failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to list files',
      });
    }
  }

  /**
   * Get storage statistics (Admin only)
   */
  async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.storageService.getStorageStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get storage stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get storage statistics',
      });
    }
  }

  /**
   * Serve file directly (for public files)
   */
  async serveFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: 'File ID is required',
        });
        return;
      }

      const fileInfo = await this.storageService.getFileInfo(fileId);

      if (!fileInfo) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      // For public files, redirect to direct URL
      if (fileInfo.bucket === 'ultramarket-images') {
        res.redirect(302, fileInfo.url);
        return;
      }

      // For private files, generate temporary download URL
      const downloadUrl = await this.storageService.getDownloadUrl(fileId, 300); // 5 minutes
      if (downloadUrl) {
        res.redirect(302, downloadUrl);
      } else {
        res.status(404).json({
          success: false,
          error: 'File not accessible',
        });
      }
    } catch (error) {
      logger.error('Serve file failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId: req.params.fileId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to serve file',
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Test MinIO connection by listing buckets
      const stats = await this.storageService.getStorageStats();

      res.status(200).json({
        success: true,
        service: 'file-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        storage: {
          totalFiles: stats.totalFiles,
          totalSize: this.formatBytes(stats.totalSize),
          buckets: stats.buckets.length,
        },
      });
    } catch (error) {
      logger.error('File service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(503).json({
        success: false,
        service: 'file-service',
        error: 'Storage connection failed',
      });
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file upload request
   */
  validateUploadRequest(req: Request, res: Response, next: Function): void {
    try {
      // Check if user is authenticated for private uploads
      if (req.body.bucket && req.body.bucket !== 'ultramarket-images') {
        if (!(req as any).user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required for private uploads',
          });
          return;
        }
      }

      // Validate bucket name if provided
      if (req.body.bucket) {
        const allowedBuckets = ['ultramarket-images', 'ultramarket-documents', 'ultramarket-files'];

        if (!allowedBuckets.includes(req.body.bucket)) {
          res.status(400).json({
            success: false,
            error: 'Invalid bucket name',
          });
          return;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation failed',
      });
    }
  }

  /**
   * Check file access permissions
   */
  async checkFileAccess(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const { fileId } = req.params;
      const user = (req as any).user;

      const fileInfo = await this.storageService.getFileInfo(fileId);

      if (!fileInfo) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      // Public files (images) are accessible to everyone
      if (fileInfo.bucket === 'ultramarket-images') {
        next();
        return;
      }

      // Private files require authentication
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Admin can access all files
      if (user.role === 'ADMIN') {
        next();
        return;
      }

      // Users can only access their own files
      // TODO: Implement user file ownership check
      // For now, allow access to authenticated users
      next();
    } catch (error) {
      logger.error('File access check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId: req.params.fileId,
      });

      res.status(500).json({
        success: false,
        error: 'Access check failed',
      });
    }
  }
}
