/**
 * @file r2-storage.service.ts
 * @brief Servicio de almacenamiento de archivos en Cloudflare R2 para CofradeNet.
 * @details Implementa la interfaz `IStorageService` usando el cliente S3 de AWS SDK
 *          apuntando al endpoint de R2. Solo se inicializa si la variable de entorno
 *          `MEDIA_STORAGE_PROVIDER` es `'r2'`, permitiendo coexistir con otros
 *          proveedores (almacenamiento local) sin conflictos.
 */

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

    /**
     * @brief Inicializa el cliente S3 apuntando al endpoint de Cloudflare R2.
     *
     * @details
     * Se ejecuta automáticamente al montar el módulo NestJS. Si `MEDIA_STORAGE_PROVIDER`
     * no es `'r2'`, el método retorna sin inicializar el cliente (el servicio queda inactivo).
     * Las credenciales y el `accountId` se obtienen de variables de entorno con `getOrThrow`,
     * lo que fuerza un error explícito en arranque si alguna variable falta.
     *
     * @pre   Las variables de entorno `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`
     *        y `R2_SECRET_ACCESS_KEY` deben estar definidas cuando `MEDIA_STORAGE_PROVIDER=r2`.
     * @post  `this.client` y `this.bucket` quedan inicializados si el proveedor es R2.
     */
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

    /**
     * @brief Verifica que el cliente R2 esté inicializado antes de cualquier operación.
     *
     * @throws {Error} Si el cliente no fue inicializado (proveedor distinto de R2 o falta de config).
     */
    private ensureReady(): void {
        if (!this.client) {
            throw new Error('R2 storage no inicializado');
        }
    }

    /**
     * @brief Sube un archivo al bucket de R2 y devuelve su referencia.
     *
     * @details
     * Genera un `fileId` único concatenando un UUID v4 con la extensión del archivo
     * original, garantizando unicidad y preservando el tipo MIME implícito en la extensión.
     * El archivo se sube con `PutObjectCommand` incluyendo `ContentType` para que R2
     * sirva los archivos con la cabecera `Content-Type` correcta.
     *
     * @pre   El cliente R2 debe estar inicializado (`ensureReady`).
     * @post  El archivo existe en R2 con la clave `fileId` y es accesible según los permisos del bucket.
     *
     * @param {UploadInput} input - Datos del archivo: `buffer`, `originalName` y `mimeType`.
     * @returns {Promise<StoredFile>} Objeto con `fileId`, `mimeType` y `size` del archivo subido.
     */
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

    /**
     * @brief Obtiene un archivo de R2 como stream de lectura.
     *
     * @details
     * Usa `GetObjectCommand` y devuelve `response.Body` casteado a `Readable`.
     * El stream se consume directamente por el controlador para enviarlo como respuesta HTTP,
     * evitando cargar el archivo completo en memoria.
     *
     * @pre   El cliente R2 debe estar inicializado.
     * @post  El stream está listo para ser consumido; el llamador es responsable de cerrarlo.
     *
     * @param {string} fileId - Identificador único del archivo en R2 (clave del objeto).
     * @returns {Promise<Readable>} Stream de lectura del contenido del archivo.
     *
     * @throws {Error} Si el archivo no existe en R2 (`response.Body` es undefined).
     */
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

    /**
     * @brief Elimina un archivo del bucket de R2 por su identificador.
     *
     * @pre   El cliente R2 debe estar inicializado.
     *
     * @param {string} fileId - Identificador único del archivo en R2 (clave del objeto).
     * @returns {Promise<void>}
     */
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
