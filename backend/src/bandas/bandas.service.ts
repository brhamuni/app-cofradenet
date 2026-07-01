/**
 * @file bandas.service.ts
 * @brief Servicio de gestión de bandas musicales de CofradeNet.
 * @details Gestiona el ciclo CRUD de bandas, sus eventos propios, la agenda anual
 *          combinada con procesiones, los enlaces externos y la verificación administrativa.
 */

import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';
import { In, Repository } from 'typeorm';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';
import { UpdateEventoDto } from '@backend/eventos/dto/update-evento.dto';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { EnlaceExterno } from './entities/enlace-externo.entity';
import { CreateEnlaceDto } from './dto/create-enlace.dto';
import type { RequestUser } from '@backend/auth/request-user.interface';

@Injectable()
export class BandasService {
    constructor(
        @InjectRepository(Banda)
        private readonly bandaRepo: Repository<Banda>,
        @InjectRepository(Marcha)
        private readonly marchaRepo: Repository<Marcha>,
        @InjectRepository(Evento)
        private readonly eventoRepo: Repository<Evento>,
        @InjectRepository(Participacion)
        private readonly participacionRepo: Repository<Participacion>,
        @InjectRepository(EnlaceExterno)
        private readonly enlaceRepo: Repository<EnlaceExterno>,
    ) {}

    /**
     * @brief Crea una nueva banda con los datos proporcionados.
     *
     * @param {CreateBandaDto} createBandaDto - DTO con los datos de la nueva banda.
     * @returns {Promise<Banda>} Entidad de la banda recién creada.
     */
    async create(createBandaDto: CreateBandaDto) {
        const nuevaBanda = this.bandaRepo.create(createBandaDto);
        return await this.bandaRepo.save(nuevaBanda);
    }

    /**
     * @brief Devuelve todas las bandas con sus relaciones de usuario propietario y ciudad.
     *
     * @returns {Promise<Banda[]>} Lista completa de bandas con `usuario` y `ciudad`.
     */
    findAll() {
        return this.bandaRepo.find({ relations: ['usuario', 'ciudad'] });
    }

    /**
     * @brief Obtiene todas las bandas pertenecientes a una ciudad concreta.
     *
     * @param {number} ciudadId - Identificador de la ciudad.
     * @returns {Promise<Banda[]>} Lista de bandas de esa ciudad con campos básicos:
     *          `id`, `nombre`, `estiloMusical` e `imagenLogo`.
     */
    async findAllByCiudad(ciudadId: number) {
        return await this.bandaRepo.find({
            where: { ciudadId },
            select: ['id', 'nombre', 'estiloMusical', 'imagenLogo'],
        });
    }

    /**
     * @brief Busca una banda por su identificador con ciudad, repertorio y eventos.
     *
     * @param {number} id - Identificador de la banda.
     * @returns {Promise<Banda>} Banda con relaciones `ciudad`, `repertorio` y `eventos`.
     *
     * @throws {NotFoundException} Si la banda no existe.
     */
    async findOne(id: number) {
        const banda = await this.bandaRepo.findOne({
            where: { id },
            relations: ['ciudad', 'repertorio', 'eventos'],
        });
        if (!banda) throw new NotFoundException('La banda no existe');
        return banda;
    }

    /**
     * @brief Actualiza los datos de una banda con control de permisos y actualización de repertorio.
     *
     * @details
     * Antes de aplicar cambios, verifica que el usuario tenga permisos:
     * solo el administrador (`rol === 'admin'`) o el propietario (`usuarioId === user.id`)
     * pueden editar la banda. Si se incluye `repertorioIds` en el DTO, realiza una
     * búsqueda de las marchas por sus IDs con el operador `In` de TypeORM y las asigna
     * directamente como relación, reemplazando el repertorio anterior completo.
     *
     * @pre   La banda debe existir y el usuario debe ser admin o su propietario.
     * @post  Los datos básicos y, si aplica, el repertorio quedan actualizados en BD.
     *
     * @param {number} id                  - Identificador de la banda a actualizar.
     * @param {UpdateBandaDto} updateBandaDto - DTO con los campos a actualizar.
     * @param {RequestUser} user           - Usuario autenticado que realiza la operación.
     * @returns {Promise<Banda>} Banda con los datos actualizados.
     *
     * @throws {NotFoundException}  Si la banda no existe.
     * @throws {ForbiddenException} Si el usuario no tiene permisos de edición.
     */
    async update(id: number, updateBandaDto: UpdateBandaDto, user: RequestUser) {
        const banda = await this.bandaRepo.findOne({
            where: { id },
            relations: ['usuario'],
        });

        if (!banda) throw new NotFoundException('Banda no encontrada');

        // Seguridad: Solo el dueño o el admin pueden editar
        if (user.rol !== 'admin' && banda.usuarioId !== user.id) {
            throw new ForbiddenException(
                'No tienes permiso para editar esta formación',
            );
        }

        const { repertorioIds, ...datosRestantes } = updateBandaDto;

        Object.assign(banda, datosRestantes);

        if (repertorioIds) {
            const marchas = await this.marchaRepo.findBy({
                id: In(repertorioIds),
            });
            banda.repertorio = marchas;
        }

        return await this.bandaRepo.save(banda);
    }

    /**
     * @brief Elimina una banda por su identificador (pendiente de implementación).
     *
     * @param {number} id - Identificador de la banda a eliminar.
     * @returns {string} Mensaje provisional indicando la acción pendiente.
     */
    remove(id: number) {
        return `This action removes a #${id} banda`;
    }

    /**
     * @brief Crea un nuevo evento propio para una banda.
     *
     * @param {number} bandaId               - Identificador de la banda organizadora.
     * @param {CreateEventoDto} createEventoDto - DTO con los datos del evento.
     * @returns {Promise<Evento>} Evento recién creado vinculado a la banda.
     *
     * @throws {NotFoundException} Si la banda no existe.
     */
    async crearEvento(bandaId: number, createEventoDto: CreateEventoDto) {
        const banda = await this.bandaRepo.findOneBy({ id: bandaId });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        const nuevoEvento = this.eventoRepo.create({
            ...createEventoDto,
            banda: { id: bandaId },
        });
        return await this.eventoRepo.save(nuevoEvento);
    }

    /**
     * @brief Obtiene todos los eventos de una banda ordenados cronológicamente.
     *
     * @param {number} bandaId - Identificador de la banda.
     * @returns {Promise<Evento[]>} Lista de eventos ordenados por `fechaHora` ascendente.
     */
    async obtenerEventos(bandaId: number) {
        return await this.eventoRepo.find({
            where: { banda: { id: bandaId } },
            order: { fechaHora: 'ASC' },
        });
    }

    /**
     * @brief Construye la agenda anual unificada de una banda combinando sus procesiones
     *        y eventos propios ordenados cronológicamente.
     *
     * @details
     * Ejecuta dos consultas independientes en paralelo conceptual (secuencial en la
     * implementación actual) y fusiona sus resultados en un array homogéneo:
     *
     * 1. **Participaciones** — Procesiones en las que la banda actúa ese año.
     *    Se carga el grafo `participacion → procesion → hermandad` para obtener el templo
     *    como campo `lugar` y el campo `ubicacion` (posición en la procesión) como `detalle`.
     *
     * 2. **Eventos propios** — Conciertos, presentaciones y demás actos de la banda.
     *    Se cargan todos los eventos y se filtra en memoria por año para evitar complicar
     *    el QueryBuilder con operadores de fecha (TypeORM no tiene `YEAR()` nativo portátil).
     *
     * El resultado unificado usa el tipo `AgendaItem` con las propiedades:
     * `{ fecha, tipo, nombre, lugar, detalle }`.
     *
     * @pre   `bandaId` debe corresponder a una banda existente.
     * @post  El array devuelto está ordenado cronológicamente ascendente por `fecha`.
     *        Si no hay actividad ese año, se devuelve un array vacío (sin error).
     *
     * @param {number} bandaId - Identificador único de la banda.
     * @param {number} anio    - Año del que se quiere obtener la agenda (p.ej. 2025).
     * @returns {Promise<any[]>} Agenda cronológica unificada con items normalizados.
     *
     * @complexity O(e) siendo e el número total de eventos de la banda; el filtrado en
     *             memoria sobre todos los eventos puede ser lento si la banda tiene historial
     *             extenso. Migrar a filtro SQL (`EXTRACT(YEAR FROM fechaHora) = :anio`) si
     *             se detecta degradación.
     *
     * @warning El filtrado de eventos se hace en memoria (JS), no en SQL. Para bandas con
     *          cientos de eventos en años anteriores, esto carga datos innecesarios de la BD.
     *
     * @note Los campos `tipo` de evento tienen valor por defecto `'Concierto'` cuando la
     *       entidad `Evento` no especifica tipo, para mantener la homogeneidad del array.
     *
     * @see BandasController.agenda
     */
    async findAgenda(bandaId: number, anio: number): Promise<any[]> {
        // 1. Buscamos las procesiones (Participaciones)
        const procesiones = await this.participacionRepo.find({
            where: { bandaId, anio },
            relations: ['procesion', 'procesion.hermandad'],
        });

        // 2. Buscamos los eventos de la banda
        const eventos = await this.eventoRepo.find({
            where: { bandaId },
        });

        // Filtramos los eventos por año manualmente para no complicar el QueryBuilder
        const eventosDelAnio = eventos.filter(
            (e) => new Date(e.fechaHora).getFullYear() === anio,
        );

        // 3. Unificamos y formateamos
        const agendaCompleta = [
            ...procesiones.map((p) => ({
                fecha: p.procesion.fecha,
                tipo: 'Procesión',
                nombre: p.procesion.nombre,
                lugar: p.procesion.hermandad.templo,
                detalle: p.ubicacion,
            })),
            ...eventosDelAnio.map((e) => ({
                fecha: e.fechaHora,
                tipo: e.tipo || 'Concierto',
                nombre: e.titulo,
                lugar: e.lugar,
                detalle: e.descripcion,
            })),
        ];

        // 4. Ordenamos por fecha
        return agendaCompleta.sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        );
    }

    /**
     * @brief Actualiza un evento de una banda con control de permisos.
     *
     * @details
     * Verifica que el evento pertenezca a la banda indicada (`bandaId`). Si el usuario
     * no es administrador, comprueba adicionalmente que sea el propietario de la banda.
     *
     * @pre   El evento debe existir y pertenecer a la banda indicada.
     * @post  Los campos del evento quedan actualizados con los valores del DTO.
     *
     * @param {number} bandaId         - Identificador de la banda propietaria del evento.
     * @param {number} eventoId        - Identificador del evento a actualizar.
     * @param {UpdateEventoDto} dto    - DTO con los campos a actualizar.
     * @param {RequestUser} user       - Usuario autenticado que realiza la operación.
     * @returns {Promise<Evento>} Evento actualizado.
     *
     * @throws {NotFoundException}  Si el evento no existe o no pertenece a la banda.
     * @throws {ForbiddenException} Si el usuario no tiene permisos de edición.
     */
    async actualizarEvento(
        bandaId: number,
        eventoId: number,
        dto: UpdateEventoDto,
        user: RequestUser,
    ) {
        const evento = await this.eventoRepo.findOne({
            where: { id: eventoId, bandaId },
        });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (user.rol !== 'admin') {
            const banda = await this.bandaRepo.findOneBy({ id: bandaId });
            if (!banda || banda.usuarioId !== user.id) {
                throw new ForbiddenException(
                    'No tienes permiso para editar este evento',
                );
            }
        }
        Object.assign(evento, dto);
        return this.eventoRepo.save(evento);
    }

    /**
     * @brief Elimina un evento de una banda con control de permisos.
     *
     * @details
     * Verifica que el evento pertenezca a la banda indicada. Si el usuario
     * no es administrador, comprueba que sea el propietario de la banda antes de eliminar.
     *
     * @param {number} bandaId   - Identificador de la banda propietaria del evento.
     * @param {number} eventoId  - Identificador del evento a eliminar.
     * @param {RequestUser} user - Usuario autenticado que realiza la operación.
     * @returns {Promise<Evento>} Evento eliminado.
     *
     * @throws {NotFoundException}  Si el evento no existe o no pertenece a la banda.
     * @throws {ForbiddenException} Si el usuario no tiene permisos de eliminación.
     */
    async eliminarEvento(bandaId: number, eventoId: number, user: RequestUser) {
        const evento = await this.eventoRepo.findOne({
            where: { id: eventoId, bandaId },
        });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (user.rol !== 'admin') {
            const banda = await this.bandaRepo.findOneBy({ id: bandaId });
            if (!banda || banda.usuarioId !== user.id) {
                throw new ForbiddenException(
                    'No tienes permiso para eliminar este evento',
                );
            }
        }
        return this.eventoRepo.remove(evento);
    }

    /**
     * @brief Establece el estado de verificación de una banda.
     *
     * @param {number} id      - Identificador de la banda.
     * @param {boolean} estado - `true` para verificar, `false` para revocar.
     * @returns {Promise<Banda>} Banda con el estado de verificación actualizado.
     *
     * @throws {NotFoundException} Si la banda no existe.
     */
    async verificar(id: number, estado: boolean) {
        const banda = await this.bandaRepo.findOneBy({ id });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        banda.verificada = estado;
        return await this.bandaRepo.save(banda);
    }

    /**
     * @brief Obtiene todos los enlaces externos de una banda ordenados por fecha de creación.
     *
     * @param {number} bandaId - Identificador de la banda.
     * @returns {Promise<EnlaceExterno[]>} Lista de enlaces ordenados ascendentemente por `createdAt`.
     */
    async getEnlaces(bandaId: number): Promise<EnlaceExterno[]> {
        return this.enlaceRepo.find({
            where: { bandaId },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * @brief Añade un nuevo enlace externo al perfil de una banda.
     *
     * @param {number} bandaId         - Identificador de la banda.
     * @param {CreateEnlaceDto} dto    - DTO con la URL y el tipo de enlace.
     * @returns {Promise<EnlaceExterno>} Entidad del enlace recién creado.
     *
     * @throws {NotFoundException} Si la banda no existe.
     */
    async addEnlace(
        bandaId: number,
        dto: CreateEnlaceDto,
    ): Promise<EnlaceExterno> {
        const banda = await this.bandaRepo.findOneBy({ id: bandaId });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        const enlace = this.enlaceRepo.create({ bandaId, ...dto });
        return this.enlaceRepo.save(enlace);
    }

    /**
     * @brief Elimina un enlace externo con verificación de propiedad o rol administrador.
     *
     * @details
     * Carga el enlace con su relación `banda` para poder comprobar si el usuario
     * autenticado es el propietario de la banda (`banda.usuarioId === user.id`).
     * Tanto el propietario como un administrador pueden eliminar cualquier enlace.
     *
     * @param {number} enlaceId  - Identificador del enlace a eliminar.
     * @param {RequestUser} user - Usuario autenticado que realiza la operación.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException}  Si el enlace no existe.
     * @throws {ForbiddenException} Si el usuario no es propietario ni administrador.
     */
    async removeEnlace(enlaceId: number, user: RequestUser): Promise<void> {
        const enlace = await this.enlaceRepo.findOne({
            where: { id: enlaceId },
            relations: ['banda'],
        });
        if (!enlace) throw new NotFoundException('Enlace no encontrado');
        const isOwner = enlace.banda?.usuarioId === user.id;
        const isAdmin = user.rol === 'admin';
        if (!isOwner && !isAdmin)
            throw new ForbiddenException(
                'Sin permisos para eliminar este enlace',
            );
        await this.enlaceRepo.remove(enlace);
    }
}
