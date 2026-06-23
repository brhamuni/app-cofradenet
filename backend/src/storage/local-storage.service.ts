import { Injectable } from '@nestjs/common';
import {
    createReadStream,
    existsSync,
    mkdirSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { IStorageService, UploadInput, StoredFile } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
    private readonly uploadsDir = join(process.cwd(), 'uploads');

    constructor() {
        if (!existsSync(this.uploadsDir)) {
            mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async upload(input: UploadInput): Promise<StoredFile> {
        const ext = extname(input.originalName) || '';
        const fileId = `${randomUUID()}${ext}`;
        const fullPath = join(this.uploadsDir, fileId);
        writeFileSync(fullPath, input.buffer);
        return {
            fileId,
            mimeType: input.mimeType,
            size: input.buffer.length,
        };
    }

    async getStream(fileId: string): Promise<Readable> {
        const fullPath = join(this.uploadsDir, fileId);
        return createReadStream(fullPath);
    }

    async delete(fileId: string): Promise<void> {
        const fullPath = join(this.uploadsDir, fileId);
        if (existsSync(fullPath)) unlinkSync(fullPath);
    }
}
