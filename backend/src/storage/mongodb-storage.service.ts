import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GridFSBucket, MongoClient, ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { IStorageService, UploadInput, StoredFile } from './storage.interface';

@Injectable()
export class MongoDbStorageService
    implements IStorageService, OnModuleInit, OnModuleDestroy
{
    private client: MongoClient;
    private bucket: GridFSBucket;

    constructor(private readonly config: ConfigService) {}

    async onModuleInit() {
        if (this.config.get<string>('MEDIA_STORAGE_PROVIDER') !== 'mongodb') {
            return;
        }

        const uri = this.config.getOrThrow<string>('MONGODB_URI');
        const database = this.config.getOrThrow<string>('MONGODB_DATABASE');
        const bucketName = this.config.get<string>('MONGODB_BUCKET') ?? 'media';

        this.client = new MongoClient(uri);
        await this.client.connect();
        this.bucket = new GridFSBucket(this.client.db(database), {
            bucketName,
        });
    }

    async onModuleDestroy() {
        await this.client?.close();
    }

    async upload(input: UploadInput): Promise<StoredFile> {
        const uploadStream = this.bucket.openUploadStream(input.originalName, {
            metadata: { mimeType: input.mimeType },
        });

        await new Promise<void>((resolve, reject) => {
            Readable.from(input.buffer)
                .pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        return {
            fileId: uploadStream.id.toHexString(),
            mimeType: input.mimeType,
            size: input.buffer.length,
        };
    }

    async getStream(fileId: string): Promise<Readable> {
        return this.bucket.openDownloadStream(new ObjectId(fileId));
    }

    async delete(fileId: string): Promise<void> {
        await this.bucket.delete(new ObjectId(fileId));
    }
}
