import { Readable } from 'node:stream';

export interface StoredFile {
    fileId: string;
    mimeType: string;
    size: number;
}

export interface UploadInput {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
}

export interface IStorageService {
    upload(input: UploadInput): Promise<StoredFile>;
    getStream(fileId: string): Promise<Readable>;
    delete(fileId: string): Promise<void>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
