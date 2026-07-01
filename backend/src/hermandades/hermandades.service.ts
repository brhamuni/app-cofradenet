/**
 * @file hermandades.service.ts
 * @brief Servicio de gestión de hermandades de CofradeNet.
 * @details Cubre el ciclo CRUD de hermandades, la actualización de perfil con control
 *          de permisos por rol, la subida de imagen de escudo y la verificación
 *          administrativa de entidades.
 */

import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hermandad } from './entities/hermandad.entity';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class HermandadesService {
    constructor(
        @InjectRepository(Hermandad)
        private readonly hermandadRepo: Repository<Hermandad>,
        @InjectRepository(Ciudad)
        private readonly ciudadRepo: Repository<Ciudad>,
    ) {}

    /**
     * @brief Crea una nueva hermandad vinculada a una ciudad existente.
     *
     * @details
     * Verifica que la ciudad referenciada por `ciudadId` exista antes de persistir
     * la hermandad. Si no existe, lanza `NotFoundException`. La ciudad se asocia
     * como entidad relacional (no solo como ID foráneo) para que TypeORM gestione
     * correctamente la restricción de integridad referencial.
     *
     * @pre   La ciudad con `createHermandadDto.ciudadId` debe existir en base de datos.
     * @post  Se crea un registro en la tabla `hermandades` con la relación a `ciudad`.
     *
     * @param {CreateHermandadDto} createHermandadDto - DTO con los datos de la hermandad,
     *        incluyendo `ciudadId` obligatorio.
     * @returns {Promise<Hermandad>} Entidad de la hermandad recién creada.
     *
     * @throws {NotFoundException} Si la ciudad especificada no existe.
     */
    async create(createHermandadDto: CreateHermandadDto) {
        const ciudad = await this.ciudadRepo.findOneBy({
            id: createHermandadDto.ciudadId,
        });

        if (!ciudad) {
            throw new NotFoundException(
                'La ciudad con ID ${createHermandadDto.ciudadId} no existe',
            );
        }

        const hermandad = this.hermandadRepo.create({
            ...createHermandadDto,
            ciudad: ciudad,
        });
        return this.hermandadRepo.save(hermandad);
    }

    /**
     * @brief Devuelve todas las hermandades con sus relaciones de ciudad y usuario propietario.
     *
     * @returns {Promise<Hermandad[]>} Lista completa de hermandades con `ciudad` y `usuario`.
     */
    async findAll() {
        return await this.hermandadRepo.find({
            relations: ['ciudad', 'usuario'],
        });
    }

    /**
     * @brief Busca una hermandad por su identificador incluyendo ciudad y procesiones.
     *
     * @param {number} id - Identificador de la hermandad.
     * @returns {Promise<Hermandad>} Hermandad con relaciones `ciudad` y `procesiones`.
     *
     * @throws {NotFoundException} Si la hermandad no existe.
     */
    async findOne(id: number) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['ciudad', 'procesiones'],
        });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');
        return hermandad;
    }

    /**
     * @brief Obtiene la hermandad vinculada al usuario autenticado.
     */
    async findByUsuario(usuarioId: number) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { usuarioId },
            relations: ['ciudad', 'procesiones', 'usuario'],
        });
        if (!hermandad) {
            throw new NotFoundException('No se encontró hermandad para este usuario');
        }
        return hermandad;
    }

    /**
     * @brief Actualiza el perfil de una hermandad con verificación de permisos por rol.
     *
     * @details
     * Implementa un control de acceso de dos niveles antes de permitir la edición:
     * 1. **Admin**: cualquier usuario con `rol === ADMIN` puede editar cualquier hermandad.
     * 2. **Propietario**: un usuario con `rol === HERMANDAD` solo puede editar la hermandad
     *    cuyo `usuario.id` coincide con su propio `id`.
     *
     * Si ninguna condición se cumple, se lanza `ForbiddenException`.
     * La actualización usa `Object.assign` para aplicar solo los campos presentes en el DTO,
     * preservando los demás valores de la entidad.
     *
     * @pre   La hermandad debe existir y el usuario debe tener rol `ADMIN` o ser su propietario.
     * @post  Los campos incluidos en `updateDto` quedan actualizados en base de datos.
     *
     * @param {number} id                    - Identificador de la hermandad a actualizar.
     * @param {UpdateHermandadDto} updateDto - Campos a actualizar (parcial).
     * @param {Usuario} user                 - Usuario autenticado que realiza la operación.
     * @returns {Promise<Hermandad>} Hermandad con los datos actualizados.
     *
     * @throws {NotFoundException}  Si la hermandad no existe.
     * @throws {ForbiddenException} Si el usuario no tiene permisos para editar esta hermandad.
     */
    async updatePerfil(
        id: number,
        updateDto: UpdateHermandadDto,
        user: Usuario,
    ) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['usuario'],
        });

        if (!hermandad) {
            throw new NotFoundException(
                'La hermandad que intentas editar no existe',
            );
        }

        const esAdmin = user.rol === RolUsuario.ADMIN;
        const esPropietario =
            user.rol === RolUsuario.HERMANDAD &&
            hermandad.usuario?.id === user.id;

        if (!esAdmin && !esPropietario) {
            throw new ForbiddenException(
                'No tienes permiso para gestionar el perfil de esta cofradía',
            );
        }

        Object.assign(hermandad, updateDto);

        return await this.hermandadRepo.save(hermandad);
    }

    /**
     * @brief Elimina una hermandad por su identificador (pendiente de implementación).
     *
     * @param {number} id - Identificador de la hermandad a eliminar.
     * @returns {string} Mensaje provisional indicando la acción pendiente.
     */
    remove(id: number) {
        return `This action removes a #${id} hermandade`;
    }

    /**
     * @brief Actualiza la imagen del escudo de una hermandad.
     *
     * @details
     * Asigna la ruta pública de la imagen al campo `imagenEscudo`. Si se proporciona
     * `escudoArchivoId`, también actualiza la referencia al archivo en el sistema de
     * almacenamiento (R2 o local), lo que permite gestionar la limpieza del archivo
     * anterior desde el servicio de archivos.
     *
     * @pre   La hermandad debe existir en base de datos.
     * @post  El campo `imagenEscudo` queda actualizado; si se proporciona `escudoArchivoId`,
     *        también `escudoArchivoId` queda actualizado.
     *
     * @param {number} id              - Identificador de la hermandad.
     * @param {string} rutaImagen      - Ruta pública o URL de la nueva imagen de escudo.
     * @param {string} [escudoArchivoId] - Identificador del archivo en el sistema de almacenamiento.
     * @returns {Promise<Hermandad>} Hermandad con la imagen actualizada.
     *
     * @throws {NotFoundException} Si la hermandad no existe.
     */
    async updateLogo(id: number, rutaImagen: string, escudoArchivoId?: string) {
        const hermandad = await this.hermandadRepo.findOneBy({ id });

        if (!hermandad) {
            throw new NotFoundException('Hermandad no encontrada');
        }

        hermandad.imagenEscudo = rutaImagen;
        if (escudoArchivoId) hermandad.escudoArchivoId = escudoArchivoId;
        return await this.hermandadRepo.save(hermandad);
    }

    /**
     * @brief Establece el estado de verificación de una hermandad.
     *
     * @details
     * Operación administrativa que marca una hermandad como verificada (`true`) o
     * revoca su verificación (`false`). La verificación indica que los datos de la
     * hermandad han sido comprobados por el equipo de CofradeNet.
     *
     * @param {number} id      - Identificador de la hermandad.
     * @param {boolean} estado - `true` para verificar, `false` para revocar.
     * @returns {Promise<Hermandad>} Hermandad con el estado de verificación actualizado.
     *
     * @throws {NotFoundException} Si la hermandad no existe.
     */
    async verificar(id: number, estado: boolean) {
        const hermandad = await this.hermandadRepo.findOneBy({ id });
        if (!hermandad)
            throw new NotFoundException(`Hermandad con ID ${id} no encontrada`);
        hermandad.verificada = estado;
        return await this.hermandadRepo.save(hermandad);
    }
}
