/**
 * @file participaciones.service.ts
 * @brief Servicio de gestión de participaciones de bandas en procesiones.
 * @details Proporciona operaciones CRUD completas sobre la entidad `Participacion`,
 *          que registra qué banda actúa en qué procesión, en qué año y en qué
 *          posición del cortejo procesional.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParticipacionDto } from './dto/create-participacion.dto';
import { UpdateParticipacionDto } from './dto/update-participacion.dto';
import { Participacion } from './entities/participacion.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';

@Injectable()
export class ParticipacionesService {
    constructor(
        @InjectRepository(Participacion)
        private readonly participacionRepository: Repository<Participacion>,
        @InjectRepository(Procesion)
        private readonly procesionesRepo: Repository<Procesion>,
    ) {}

    /**
     * @brief Crea una nueva participación de banda en una procesión.
     *
     * @param {CreateParticipacionDto} createParticipacionDto - DTO con `bandaId`,
     *        `procesionId`, `anio` y `ubicacion` opcional.
     * @returns {Promise<Participacion>} Participación recién creada.
     */
    async create(createParticipacionDto: CreateParticipacionDto) {
        const nueva = this.participacionRepository.create(
            createParticipacionDto,
        );
        return await this.participacionRepository.save(nueva);
    }

    /**
     * @brief Obtiene todas las participaciones con sus relaciones de banda y procesión.
     *
     * @returns {Promise<Participacion[]>} Lista completa de participaciones con `banda` y `procesion`.
     */
    findAll() {
        return this.participacionRepository.find({
            relations: ['banda', 'procesion'],
        });
    }

    /**
     * @brief Busca una participación por su identificador con banda y procesión.
     *
     * @param {number} id - Identificador de la participación.
     * @returns {Promise<Participacion | null>} Participación con relaciones o `null` si no existe.
     */
    findOne(id: number) {
        return this.participacionRepository.findOne({
            where: { id },
            relations: ['banda', 'procesion'],
        });
    }

    /**
     * @brief Actualiza una participación existente y devuelve el registro actualizado.
     *
     * @param {number} id                                  - Identificador de la participación.
     * @param {UpdateParticipacionDto} updateParticipacionDto - DTO con los campos a actualizar.
     * @returns {Promise<Participacion | null>} Participación actualizada con relaciones.
     */
    async update(id: number, updateParticipacionDto: UpdateParticipacionDto) {
        await this.participacionRepository.update(id, updateParticipacionDto);
        return this.findOne(id);
    }

    /**
     * @brief Elimina una participación por su identificador.
     *
     * @details
     * Busca la participación antes de eliminar para devolver la entidad eliminada.
     * Si no existe, la operación retorna `undefined` silenciosamente.
     *
     * @param {number} id - Identificador de la participación a eliminar.
     * @returns {Promise<Participacion | undefined>} Participación eliminada o `undefined`.
     */
    async remove(id: number) {
        const participacion = await this.findOne(id);
        if (participacion) {
            return await this.participacionRepository.remove(participacion);
        }
    }
}
