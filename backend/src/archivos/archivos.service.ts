import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Readable } from 'node:stream';
import { Archivo } from './entities/archivo.entity';
import {
    STORAGE_SERVICE,
    UploadInput,
} from '@backend/storage/storage.interface';
import type { IStorageService } from '@backend/storage/storage.interface';

@Injectable()
export class ArchivosService {
    constructor(
        @InjectRepository(Archivo)
        private readonly archivosRepo: Repository<Archivo>,
        @Inject(STORAGE_SERVICE)
        private readonly storage: IStorageService,
        private readonly config: ConfigService,
    ) {}

    async store(input: UploadInput): Promise<Archivo> {
        const stored = await this.storage.upload(input);
        const storageProvider =
            this.config.get<string>('MEDIA_STORAGE_PROVIDER') ?? 'local';

        const archivo = this.archivosRepo.create({
            storageProvider,
            fileId: stored.fileId,
            mimeType: stored.mimeType,
            originalName: input.originalName,
            size: stored.size,
        });

        return this.archivosRepo.save(archivo);
    }

    async findOne(id: string): Promise<Archivo> {
        const archivo = await this.archivosRepo.findOne({ where: { id } });
        if (!archivo) throw new NotFoundException('Archivo no encontrado');
        return archivo;
    }

    async getStream(
        id: string,
    ): Promise<{ archivo: Archivo; stream: Readable }> {
        const archivo = await this.findOne(id);
        const stream = await this.storage.getStream(archivo.fileId);
        return { archivo, stream };
    }

    async remove(id: string): Promise<void> {
        const archivo = await this.findOne(id);
        await this.storage.delete(archivo.fileId);
        await this.archivosRepo.remove(archivo);
    }

    /** Ruta pública relativa consumida por el frontend vía resolveImg() */
    publicPath(archivoId: string): string {
        return `archivos/${archivoId}`;
    }
}
