/**
 * @file ubicacion.service.ts
 * @brief Servicio de ubicación en tiempo real y estado de pasos de CofradeNet.
 * @details Gestiona el inicio, finalización y actualización de la posición GPS de
 *          procesiones activas, así como el registro del estado de cada paso a lo
 *          largo del recorrido. Las actualizaciones se emiten en tiempo real a través
 *          de WebSockets mediante `UbicacionGateway`.
 */

import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UbicacionTiempoReal } from './entities/ubicacion-tiempo-real.entity';
import { EstadoPaso } from './entities/estado-paso.entity';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CreateEstadoPasoDto } from './dto/create-estado-paso.dto';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { UbicacionGateway } from './ubicacion.gateway';
import type { RequestUser } from '@backend/auth/request-user.interface';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class UbicacionService {
    constructor(
        @InjectRepository(UbicacionTiempoReal)
        private readonly ubicacionRepo: Repository<UbicacionTiempoReal>,
        @InjectRepository(EstadoPaso)
        private readonly estadoPasoRepo: Repository<EstadoPaso>,
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
        @Inject(forwardRef(() => UbicacionGateway))
        private readonly gateway: UbicacionGateway,
    ) {}

    /**
     * @brief Verifica que el usuario sea el administrador de la hermandad propietaria de la procesión.
     *
     * @details
     * Carga la procesión con su hermandad asociada y comprueba si el `usuarioId` de la
     * hermandad coincide con el `id` del usuario autenticado. Los administradores del
     * sistema (`rol === ADMIN`) siempre tienen acceso sin importar la propiedad.
     * Este método se usa como guardia de acceso en todas las operaciones de escritura
     * sobre ubicaciones y estados de pasos.
     *
     * @param {number} procesionId - Identificador de la procesión a verificar.
     * @param {RequestUser} user   - Usuario autenticado que realiza la operación.
     * @returns {Promise<Procesion>} La procesión cargada con su hermandad si la verificación pasa.
     *
     * @throws {NotFoundException}  Si la procesión no existe.
     * @throws {ForbiddenException} Si el usuario no es propietario de la hermandad ni administrador.
     */
    async assertHermandadOwner(procesionId: number, user: RequestUser) {
        const procesion = await this.procesionRepo.findOne({
            where: { id: procesionId },
            relations: ['hermandad'],
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const isOwner = procesion.hermandad?.usuarioId === user.id;
        const isAdmin = user.rol === RolUsuario.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException(
                'Solo el administrador de la hermandad puede realizar esta acción',
            );
        }
        return procesion;
    }

    /**
     * @brief Obtiene todas las procesiones con ubicación activa en este momento.
     *
     * @returns {Promise<UbicacionTiempoReal[]>} Ubicaciones activas con sus procesiones y hermandades.
     */
    async getActivas() {
        return this.ubicacionRepo.find({
            where: { estaActiva: true },
            relations: ['procesion', 'procesion.hermandad'],
        });
    }

    /**
     * @brief Obtiene la ubicación en tiempo real de una procesión concreta.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @returns {Promise<UbicacionTiempoReal | null>} Entidad de ubicación o `null` si no existe.
     */
    async getByProcesion(procesionId: number) {
        return this.ubicacionRepo.findOne({ where: { procesionId } });
    }

    /**
     * @brief Inicia el compartido de ubicación en tiempo real para una procesión.
     *
     * @details
     * Verifica permisos con `assertHermandadOwner`. Si ya existe un registro de ubicación
     * para la procesión, lo reutiliza (evitando duplicados). Si no existe, crea uno nuevo.
     * Establece `estaActiva = true` y registra el `compartidoPorId` del usuario que activa.
     *
     * @pre   El usuario debe ser el administrador de la hermandad o un administrador del sistema.
     * @post  El campo `estaActiva` de la ubicación queda a `true`.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {RequestUser} user   - Usuario autenticado que inicia el compartido.
     * @returns {Promise<UbicacionTiempoReal>} Entidad de ubicación activada.
     *
     * @throws {NotFoundException}  Si la procesión no existe.
     * @throws {ForbiddenException} Si el usuario no tiene permisos.
     */
    async iniciar(procesionId: number, user: RequestUser) {
        await this.assertHermandadOwner(procesionId, user);
        let ubicacion = await this.ubicacionRepo.findOne({
            where: { procesionId },
        });
        if (!ubicacion) {
            ubicacion = this.ubicacionRepo.create({ procesionId });
        }
        ubicacion.estaActiva = true;
        ubicacion.compartidoPorId = user.id;
        return this.ubicacionRepo.save(ubicacion);
    }

    /**
     * @brief Finaliza el compartido de ubicación en tiempo real para una procesión.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {RequestUser} user   - Usuario autenticado que finaliza el compartido.
     * @returns {Promise<UbicacionTiempoReal>} Entidad de ubicación desactivada.
     *
     * @throws {NotFoundException}  Si la procesión o la ubicación no existen.
     * @throws {ForbiddenException} Si el usuario no tiene permisos.
     */
    async finalizar(procesionId: number, user: RequestUser) {
        await this.assertHermandadOwner(procesionId, user);
        const ubicacion = await this.ubicacionRepo.findOne({
            where: { procesionId },
        });
        if (!ubicacion) throw new NotFoundException('Ubicación no encontrada');
        ubicacion.estaActiva = false;
        return this.ubicacionRepo.save(ubicacion);
    }

    /**
     * @brief Actualiza las coordenadas GPS de una procesión y emite el evento WebSocket.
     *
     * @details
     * Tras verificar permisos, actualiza los campos `latitud`, `longitud` y `estaActiva`
     * si están presentes en el DTO (actualización parcial). Una vez persistida la entidad,
     * llama a `gateway.emitUbicacionActualizada` para notificar en tiempo real a todos los
     * clientes suscritos a esa procesión.
     *
     * @pre   El usuario debe tener permisos de escritura sobre la procesión.
     * @post  La ubicación queda actualizada en BD y el evento se emite por WebSocket.
     *
     * @param {number} procesionId         - Identificador de la procesión.
     * @param {UpdateUbicacionDto} dto     - DTO con `latitud`, `longitud` y/o `estaActiva`.
     * @param {RequestUser} user           - Usuario autenticado que actualiza la ubicación.
     * @returns {Promise<UbicacionTiempoReal>} Entidad de ubicación actualizada.
     *
     * @throws {NotFoundException}  Si la procesión no existe.
     * @throws {ForbiddenException} Si el usuario no tiene permisos.
     */
    async updateUbicacion(
        procesionId: number,
        dto: UpdateUbicacionDto,
        user: RequestUser,
    ) {
        await this.assertHermandadOwner(procesionId, user);
        let ubicacion = await this.ubicacionRepo.findOne({
            where: { procesionId },
        });
        if (!ubicacion) {
            ubicacion = this.ubicacionRepo.create({ procesionId });
        }
        if (dto.latitud !== undefined) ubicacion.latitud = dto.latitud;
        if (dto.longitud !== undefined) ubicacion.longitud = dto.longitud;
        if (dto.estaActiva !== undefined) ubicacion.estaActiva = dto.estaActiva;
        ubicacion.compartidoPorId = user.id;
        const saved = await this.ubicacionRepo.save(ubicacion);
        this.gateway.emitUbicacionActualizada(procesionId, saved);
        return saved;
    }

    /**
     * @brief Obtiene los estados de paso de una procesión, opcionalmente filtrados por paso.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {number} [pasoId]    - Identificador del paso (opcional). Si se omite, devuelve todos.
     * @returns {Promise<EstadoPaso[]>} Hasta 50 estados de paso, ordenados por `createdAt` descendente.
     */
    async getEstadosPaso(procesionId: number, pasoId?: number) {
        const where: FindOptionsWhere<EstadoPaso> = { procesionId };
        if (pasoId !== undefined) where.pasoId = pasoId;
        return this.estadoPasoRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
            relations: ['paso'],
        });
    }

    /**
     * @brief Obtiene el estado más reciente de un paso concreto en una procesión.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {number} pasoId      - Identificador del paso.
     * @returns {Promise<EstadoPaso | null>} Estado más reciente del paso, o `null` si no existe.
     */
    async getUltimoEstadoPaso(procesionId: number, pasoId: number) {
        return this.estadoPasoRepo.findOne({
            where: { procesionId, pasoId },
            order: { createdAt: 'DESC' },
            relations: ['paso'],
        });
    }

    /**
     * @brief Registra un nuevo estado para un paso y emite el evento WebSocket correspondiente.
     *
     * @details
     * Crea el estado con las coordenadas opcionales y el estado descriptivo del paso.
     * Tras persistirlo, notifica en tiempo real a los clientes conectados mediante
     * `gateway.emitEstadoPasoActualizado`.
     *
     * @post  El nuevo estado queda registrado en BD y el evento se emite por WebSocket.
     *
     * @param {number} procesionId         - Identificador de la procesión.
     * @param {number} pasoId              - Identificador del paso por defecto (puede ser sobreescrito por `dto.pasoId`).
     * @param {CreateEstadoPasoDto} dto    - DTO con `estado`, `latitud`, `longitud` y `pasoId` opcionales.
     * @param {number} userId              - Identificador del usuario que registra el estado.
     * @returns {Promise<EstadoPaso>} Estado de paso recién creado.
     */
    async createEstadoPaso(
        procesionId: number,
        pasoId: number,
        dto: CreateEstadoPasoDto,
        userId: number,
    ) {
        const estado = this.estadoPasoRepo.create({
            procesionId,
            pasoId: dto.pasoId ?? pasoId,
            estado: dto.estado,
            latitud: dto.latitud,
            longitud: dto.longitud,
            autorId: userId,
        });
        const saved = await this.estadoPasoRepo.save(estado);
        this.gateway.emitEstadoPasoActualizado(procesionId, saved);
        return saved;
    }

    /**
     * @brief Elimina un estado de paso con verificación de propiedad, autoría o rol admin.
     *
     * @details
     * Permite eliminar el estado si el usuario cumple al menos una de estas condiciones:
     * - Es propietario de la hermandad de la procesión.
     * - Es administrador del sistema.
     * - Es el autor del estado (`autorId === user.id`).
     *
     * @param {number} estadoId  - Identificador del estado de paso a eliminar.
     * @param {RequestUser} user - Usuario autenticado que solicita la eliminación.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException}  Si el estado de paso no existe.
     * @throws {ForbiddenException} Si el usuario no cumple ninguna de las condiciones de acceso.
     */
    async deleteEstadoPaso(estadoId: number, user: RequestUser) {
        const estado = await this.estadoPasoRepo.findOne({
            where: { id: estadoId },
            relations: ['procesion', 'procesion.hermandad'],
        });
        if (!estado)
            throw new NotFoundException('Estado de paso no encontrado');
        const isOwner = estado.procesion?.hermandad?.usuarioId === user.id;
        const isAdmin = user.rol === RolUsuario.ADMIN;
        const isAuthor = estado.autorId === user.id;
        if (!isOwner && !isAdmin && !isAuthor) {
            throw new ForbiddenException(
                'Sin permisos para eliminar este estado',
            );
        }
        await this.estadoPasoRepo.remove(estado);
    }
}
