/**
 * @file archivos.service.ts
 * @brief Servicio de gestión de archivos multimedia de CofradeNet.
 * @details Abstrae el almacenamiento de archivos (R2 o local) mediante la interfaz
 *          `IStorageService`, persiste los metadatos en base de datos y proporciona
 *          acceso por stream para servir archivos sin cargarlos en memoria.
 */

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

    /**
     * @brief Sube un archivo al proveedor de almacenamiento activo y persiste sus metadatos.
     *
     * @details
     * Delega la subida al proveedor inyectado (`IStorageService`), que puede ser R2 o local
     * dependiendo de `MEDIA_STORAGE_PROVIDER`. Tras el almacenamiento, crea un registro en
     * la tabla `archivos` con los metadatos relevantes (`fileId`, `mimeType`, `originalName`,
     * `size`, `storageProvider`), desacoplando la referencia del archivo de su ubicación física.
     *
     * @pre   El proveedor de almacenamiento debe estar correctamente configurado e inicializado.
     * @post  Existe un registro en `archivos` con los metadatos del archivo subido.
     *
     * @param {UploadInput} input - Datos del archivo: `buffer`, `originalName` y `mimeType`.
     * @returns {Promise<Archivo>} Entidad de metadatos del archivo recién almacenado.
     */
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

    /**
     * @brief Busca los metadatos de un archivo por su identificador UUID.
     *
     * @param {string} id - Identificador UUID del registro en la tabla `archivos`.
     * @returns {Promise<Archivo>} Entidad de metadatos del archivo.
     *
     * @throws {NotFoundException} Si el archivo no existe en base de datos.
     */
    async findOne(id: string): Promise<Archivo> {
        const archivo = await this.archivosRepo.findOne({ where: { id } });
        if (!archivo) throw new NotFoundException('Archivo no encontrado');
        return archivo;
    }

    /**
     * @brief Obtiene los metadatos de un archivo y un stream de lectura de su contenido.
     *
     * @details
     * Combina `findOne` (para obtener `fileId` y metadatos) con `storage.getStream`
     * (para obtener el stream del proveedor). El llamador es responsable de consumir
     * y cerrar el stream para liberar la conexión de red (en R2) o el descriptor de archivo.
     *
     * @param {string} id - Identificador UUID del archivo.
     * @returns {Promise<{ archivo: Archivo; stream: Readable }>}
     *          Metadatos del archivo y stream de su contenido.
     *
     * @throws {NotFoundException} Si el archivo no existe en base de datos.
     * @throws {Error}             Si el archivo no existe en el proveedor de almacenamiento.
     */
    async getStream(
        id: string,
    ): Promise<{ archivo: Archivo; stream: Readable }> {
        const archivo = await this.findOne(id);
        const stream = await this.storage.getStream(archivo.fileId);
        return { archivo, stream };
    }

    /**
     * @brief Elimina un archivo del proveedor de almacenamiento y sus metadatos de base de datos.
     *
     * @details
     * El orden de operaciones es: primero eliminar del proveedor (R2/local), luego el registro
     * en BD. Si la eliminación del proveedor falla, el registro en BD no se elimina, evitando
     * referencias huérfanas en sentido inverso.
     *
     * @param {string} id - Identificador UUID del archivo.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException} Si el archivo no existe en base de datos.
     */
    async remove(id: string): Promise<void> {
        const archivo = await this.findOne(id);
        await this.storage.delete(archivo.fileId);
        await this.archivosRepo.remove(archivo);
    }

    /**
     * @brief Construye la ruta pública relativa del archivo para su consumo desde el frontend.
     *
     * @details
     * Devuelve una ruta relativa que el frontend puede pasar a la función `resolveImg()`
     * para construir la URL completa del endpoint de servicio de archivos.
     *
     * @param {string} archivoId - Identificador UUID del archivo.
     * @returns {string} Ruta relativa en formato `archivos/{archivoId}`.
     */
    publicPath(archivoId: string): string {
        return `archivos/${archivoId}`;
    }
}
