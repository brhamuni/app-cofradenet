import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { IStorageService, StoredFile, UploadInput } from './storage.interface';

@Injectable()
export class R2StorageService implements IStorageService, OnModuleInit {
    private client: S3Client;
    private bucket: string;

    constructor(private readonly config: ConfigService) {}

    onModuleInit() {
        if (this.config.get<string>('MEDIA_STORAGE_PROVIDER') !== 'r2') {
            return;
        }

        const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
        this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
                secretAccessKey: this.config.getOrThrow<string>(
                    'R2_SECRET_ACCESS_KEY',
                ),
            },
        });
    }

    private ensureReady(): void {
        if (!this.client) {
            throw new Error('R2 storage no inicializado');
        }
    }

    async upload(input: UploadInput): Promise<StoredFile> {
        this.ensureReady();

        const ext = extname(input.originalName) || '';
        const fileId = `${randomUUID()}${ext}`;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: fileId,
                Body: input.buffer,
                ContentType: input.mimeType,
            }),
        );

        return {
            fileId,
            mimeType: input.mimeType,
            size: input.buffer.length,
        };
    }

    async getStream(fileId: string): Promise<Readable> {
        this.ensureReady();

        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileId,
            }),
        );

        if (!response.Body) {
            throw new Error(`Archivo no encontrado en R2: ${fileId}`);
        }

        return response.Body as Readable;
    }

    async delete(fileId: string): Promise<void> {
        this.ensureReady();

        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: fileId,
            }),
        );
    }
}
