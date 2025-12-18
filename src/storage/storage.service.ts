import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { StoragePath } from './enums/storage-path.enum';
import {
  UploadOptions,
  FileInfo,
} from './interfaces/storage-options.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get('DO_SPACES_REGION');
    const endpoint = this.configService.get('DO_SPACES_ENDPOINT');
    const accessKeyId = this.configService.get('DO_SPACES_KEY');
    const secretAccessKey = this.configService.get('DO_SPACES_SECRET');

    if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('DigitalOcean Spaces configuration is incomplete');
    }

    this.s3 = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket =
      this.configService.get('DO_SPACES_BUCKET') || 'default-bucket';
    this.cdnUrl = this.configService.get('DO_SPACES_CDN_URL') || endpoint;

    this.logger.log('Storage service initialized with DigitalOcean Spaces');
  }

  /**
   * Sube un archivo a DigitalOcean Spaces
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<FileInfo> {
    // Validaciones
    if (options.maxSize && buffer.length > options.maxSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${options.maxSize} bytes`,
      );
    }

    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
      );
    }

    // Generar key único
    const timestamp = Date.now();
    const uuid = randomUUID();
    const extension = this.getFileExtension(originalName);
    const sanitizedName = this.sanitizeFilename(originalName);
    const key = `upload/${options.path}/${timestamp}-${uuid}-${sanitizedName}${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: options.isPublic !== false ? 'public-read' : 'private',
        Metadata: {
          originalName: sanitizedName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3.send(command);

      const publicUrl =
        options.isPublic !== false ? `${this.cdnUrl}/${key}` : undefined;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url: key,
        publicUrl,
        size: buffer.length,
        mimeType,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Genera una URL firmada temporal (para archivos privados)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new BadRequestException('Failed to generate signed URL');
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene URL pública de un archivo
   */
  getPublicUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  // ============= HELPERS =============

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]/gi, '-') // Replace special chars
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  // ============= MÉTODOS ESPECÍFICOS POR MÓDULO =============

  async uploadVoucher(buffer: Buffer, originalName: string, mimeType: string) {
    return this.uploadFile(buffer, originalName, mimeType, {
      path: StoragePath.VOUCHERS,
      isPublic: false,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/pdf',
      ],
    });
  }

  async uploadEventImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    return this.uploadFile(buffer, originalName, mimeType, {
      path: StoragePath.EVENTS,
      isPublic: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
  }

  async uploadSpeakerPhoto(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    return this.uploadFile(buffer, originalName, mimeType, {
      path: StoragePath.SPEAKERS,
      isPublic: true,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    });
  }

  async uploadCompanyLogo(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    return this.uploadFile(buffer, originalName, mimeType, {
      path: StoragePath.COMPANIES,
      isPublic: true,
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
    });
  }
}
