/**
 * @file procesiones.service.ts
 * @brief Servicio de gestión de procesiones de CofradeNet.
 * @details Cubre el ciclo CRUD de procesiones, la asignación de bandas, la gestión
 *          de participaciones e itinerarios anuales, los pasos, y búsquedas avanzadas
 *          con filtros combinados e insensibles a acentos.
 */

import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { CreateProcesionDto as CreateProcesionDto } from './dto/create-procesion.dto';
import { UpdateProcesionDto } from './dto/update-procesion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { MoreThanOrEqual, In, Repository } from 'typeorm';
import { Procesion } from './entities/procesion.entity';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Itinerario } from '@backend/itinerarios/entities/itinerario.entity';
import { PuntoItinerario } from './entities/punto-itinerario.entity';
import { Paso } from './entities/paso.entity';

@Injectable()
export class ProcesionesService {
    constructor(
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
        @InjectRepository(Hermandad)
        private readonly hermandadRepo: Repository<Hermandad>,
        @InjectRepository(Banda)
        private readonly bandaRepo: Repository<Banda>,
        @InjectRepository(Participacion)
        private readonly participacionRepo: Repository<Participacion>,
        @InjectRepository(Itinerario)
        private readonly itinerarioRepo: Repository<Itinerario>,
        @InjectRepository(Paso)
        private readonly pasoRepo: Repository<Paso>,
        @InjectRepository(PuntoItinerario)
        private readonly puntoItinerarioRepo: Repository<PuntoItinerario>,
        @InjectRepository(Seguimiento)
        private readonly seguimientoRepo: Repository<Seguimiento>,
    ) {}

    /**
     * @brief Crea una nueva procesión con verificación de permisos para usuarios tipo hermandad.
     *
     * @details
     * Si el usuario autenticado tiene rol `HERMANDAD`, se verifica que la hermandad
     * indicada en el DTO sea efectivamente la suya (comprobando que `hermandadPropia.id`
     * coincida con `hermandadId`). Los administradores pueden crear procesiones para
     * cualquier hermandad sin restricción. La hermandad se asocia por referencia de ID
     * para evitar cargar la entidad completa innecesariamente.
     *
     * @pre   La hermandad referenciada debe existir si el rol es `HERMANDAD`.
     * @post  Se crea un registro en `procesiones` vinculado a la hermandad indicada.
     *
     * @param {CreateProcesionDto} createProcesionDto - DTO con los datos de la procesión,
     *        incluyendo `hermandadId` obligatorio.
     * @param {any} req - Objeto del usuario autenticado con al menos `id` y `rol`.
     * @returns {Promise<Procesion>} Entidad de la procesión recién creada.
     *
     * @throws {ForbiddenException} Si el usuario tipo `HERMANDAD` intenta crear una
     *         procesión para una hermandad que no le pertenece.
     */
    async create(createProcesionDto: CreateProcesionDto, req: any) {
        const { hermandadId, ...datosProcesion } = createProcesionDto;

        if (req.rol === RolUsuario.HERMANDAD) {
            const hermandadPropia = await this.hermandadRepo.findOne({
                where: { usuario: { id: req.id } as Usuario },
            });

            if (!hermandadPropia || hermandadPropia.id !== hermandadId) {
                throw new ForbiddenException(
                    'No tienes permiso para crear procesiones para esta hermandad',
                );
            }
        }

        const nuevaProcesion = this.procesionRepo.create({
            ...datosProcesion,
            hermandad: { id: hermandadId } as Hermandad,
        });

        return await this.procesionRepo.save(nuevaProcesion);
    }

    /**
     * @brief Devuelve todas las procesiones con sus relaciones de hermandad e itinerario.
     *
     * @returns {Promise<Procesion[]>} Lista completa de procesiones ordenada por `fecha`
     *          y `horaSalida` ascendente.
     */
    findAll() {
        return this.procesionRepo.find({
            relations: ['hermandad', 'itinerario'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
        });
    }

    /**
     * @brief Obtiene todas las procesiones de una hermandad concreta.
     *
     * @param {number} id - Identificador de la hermandad.
     * @returns {Promise<Procesion[]>} Procesiones de la hermandad con itinerario,
     *          ordenadas por `fecha` y `horaSalida` ascendente.
     */
    async buscarPorHermandad(id: number) {
        return await this.procesionRepo.find({
            where: { hermandad: { id: id } },
            relations: ['itinerario'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
        });
    }

    /**
     * @brief Busca una procesión por su identificador e incluye el itinerario ordenado por posición.
     *
     * @details
     * Tras la consulta, ordena el array `itinerario` por el campo `orden` en memoria,
     * ya que TypeORM no permite ordenar relaciones anidadas directamente en `findOne`.
     *
     * @param {number} id - Identificador de la procesión.
     * @returns {Promise<Procesion>} Procesión con `hermandad` e `itinerario` ordenado.
     *
     * @throws {NotFoundException} Si la procesión no existe.
     */
    async findOne(id: number) {
        const procesion = await this.procesionRepo.findOne({
            where: { id },
            relations: ['hermandad', 'itinerario'],
        });

        if (!procesion) throw new NotFoundException('La procesión no existe');

        procesion.itinerario.sort((a, b) => a.orden - b.orden);

        return procesion;
    }

    /**
     * @brief Obtiene las próximas procesiones de una ciudad a partir de hoy.
     *
     * @details
     * Filtra procesiones cuya `fecha` sea mayor o igual a la fecha actual (formato ISO
     * `YYYY-MM-DD`) y cuya hermandad pertenezca a la ciudad indicada. Limita el resultado
     * a las 10 próximas procesiones para uso en widgets o secciones de portada.
     *
     * @param {number} ciudadId - Identificador de la ciudad.
     * @returns {Promise<Procesion[]>} Hasta 10 procesiones futuras de la ciudad,
     *          ordenadas por `fecha` y `horaSalida` ascendente.
     */
    async buscarPorCiudad(ciudadId: number) {
        const hoy = new Date().toISOString().split('T')[0];

        return await this.procesionRepo.find({
            where: {
                fecha: MoreThanOrEqual(hoy),
                hermandad: { ciudad: { id: ciudadId } },
            },
            relations: ['hermandad', 'itinerario'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
            take: 10,
        });
    }

    /**
     * @brief Actualiza los datos de una procesión (pendiente de implementación).
     *
     * @param {number} id - Identificador de la procesión a actualizar.
     * @param {UpdateProcesionDto} updateProcesionDto - DTO con los campos a actualizar.
     * @returns {string} Mensaje provisional indicando la acción pendiente.
     */
    update(id: number, updateProcesionDto: UpdateProcesionDto) {
        return `This action updates a #${id} procesione`;
    }

    /**
     * @brief Elimina una procesión con control de permisos por rol y propiedad de hermandad.
     *
     * @details
     * Aplica dos niveles de autorización:
     * 1. Si el usuario es `ADMIN` → elimina directamente sin más comprobaciones.
     * 2. Si el usuario es propietario de la hermandad (`hermandad.usuario.id === user.id`)
     *    → elimina y devuelve mensaje de éxito.
     * 3. En cualquier otro caso → lanza `ForbiddenException`.
     *
     * @param {number} id   - Identificador de la procesión a eliminar.
     * @param {any} user    - Objeto del usuario autenticado con `id` y `rol`.
     * @returns {Promise<object>} Objeto con `message` confirmando la eliminación.
     *
     * @throws {NotFoundException}  Si la procesión no existe.
     * @throws {ForbiddenException} Si el usuario no tiene permisos para borrar la procesión.
     */
    async remove(id: number, user: any) {
        const procesion = await this.procesionRepo.findOne({
            where: { id },
            relations: ['hermandad', 'hermandad.usuario'],
        });

        if (!procesion) throw new NotFoundException('Procesión no encontrada');

        if (user.rol === RolUsuario.ADMIN) {
            await this.procesionRepo.remove(procesion);
            return { message: 'Procesión eliminada por el administrador' };
        }

        if (
            !procesion.hermandad.usuario ||
            procesion.hermandad.usuario.id !== user.id
        ) {
            throw new ForbiddenException(
                'No tienes permiso para borrar esta procesión',
            );
        }

        await this.procesionRepo.remove(procesion);
        return { message: 'Procesión eliminada correctamente' };
    }

    /**
     * @brief Asigna una banda a una procesión creando un registro de participación.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {number} bandaId     - Identificador de la banda participante.
     * @param {number} anio        - Año de la participación.
     * @param {string} ubicacion   - Posición de la banda en la procesión (p.ej. "Detrás del paso").
     * @returns {Promise<Participacion>} Registro de participación recién creado.
     *
     * @throws {NotFoundException} Si la procesión no existe.
     */
    async asignarBanda(
        procesionId: number,
        bandaId: number,
        anio: number,
        ubicacion: string,
    ) {
        const procesion = await this.procesionRepo.findOne({
            where: { id: procesionId },
        });
        if (!procesion)
            throw new NotFoundException(
                'No se ha podido encontrar ninguna procesion',
            );

        await this.bandaRepo.findOne({ where: { id: bandaId } });

        const nuevaParticipacion = this.participacionRepo.create({
            procesion: { id: procesionId },
            banda: { id: bandaId },
            anio,
            ubicacion,
        });

        return await this.participacionRepo.save(nuevaParticipacion);
    }

    /**
     * @brief Obtiene todas las participaciones de una procesión con los datos de cada banda.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @returns {Promise<Participacion[]>} Participaciones ordenadas por `anio` descendente
     *          con la relación `banda` incluida.
     */
    async getParticipaciones(procesionId: number) {
        return this.participacionRepo.find({
            where: { procesionId },
            relations: ['banda'],
            order: { anio: 'DESC' },
        });
    }

    /**
     * @brief Añade una nueva participación de banda a una procesión.
     *
     * @param {number} procesionId                               - Identificador de la procesión.
     * @param {{ bandaId: number; anio: number; ubicacion?: string }} dto - Datos de la participación.
     * @returns {Promise<Participacion>} Registro de participación recién creado.
     *
     * @throws {NotFoundException} Si la procesión no existe.
     */
    async addParticipacion(
        procesionId: number,
        dto: {
            bandaId?: number;
            nombreBanda?: string;
            anio: number;
            ubicacion?: string;
        },
    ) {
        const procesion = await this.procesionRepo.findOneBy({
            id: procesionId,
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');

        const nombreLibre = dto.nombreBanda?.trim();
        if (!dto.bandaId && !nombreLibre) {
            throw new BadRequestException(
                'Indica una banda registrada o un nombre de banda',
            );
        }

        if (dto.bandaId) {
            const banda = await this.bandaRepo.findOneBy({ id: dto.bandaId });
            if (!banda) throw new NotFoundException('Banda no encontrada');
        }

        const nueva = this.participacionRepo.create({
            procesionId,
            anio: dto.anio,
            ubicacion: dto.ubicacion,
            bandaId: dto.bandaId ?? null,
            nombreBanda: dto.bandaId ? null : nombreLibre,
        });
        const saved = await this.participacionRepo.save(nueva);
        return this.participacionRepo.findOne({
            where: { id: saved.id },
            relations: ['banda'],
        });
    }

    /**
     * @brief Actualiza los datos de una participación existente.
     *
     * @param {number} pid - Identificador de la participación.
     * @param {Partial<{ bandaId: number; anio: number; ubicacion: string }>} dto - Campos a actualizar.
     * @returns {Promise<Participacion | null>} Participación actualizada con la relación `banda`.
     */
    async updateParticipacion(
        pid: number,
        dto: Partial<{ bandaId: number; anio: number; ubicacion: string }>,
    ) {
        await this.participacionRepo.update(pid, dto);
        return this.participacionRepo.findOne({
            where: { id: pid },
            relations: ['banda'],
        });
    }

    /**
     * @brief Elimina una participación por su identificador.
     *
     * @param {number} pid - Identificador de la participación a eliminar.
     * @returns {Promise<Participacion>} Participación eliminada.
     *
     * @throws {NotFoundException} Si la participación no existe.
     */
    async removeParticipacion(pid: number) {
        const p = await this.participacionRepo.findOneBy({ id: pid });
        if (!p) throw new NotFoundException('Participación no encontrada');
        return this.participacionRepo.remove(p);
    }

    /**
     * @brief Obtiene todos los itinerarios de una procesión ordenados por año descendente.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @returns {Promise<Itinerario[]>} Lista de itinerarios ordenados por `anio` descendente.
     */
    async getItinerarios(procesionId: number) {
        return this.itinerarioRepo.find({
            where: { procesionId },
            order: { anio: 'DESC' },
        });
    }

    /**
     * @brief IDs de hermandades que el usuario sigue (para acceso a itinerarios).
     */
    private async getHermandadIdsSeguidas(userId: number): Promise<number[]> {
        const seguimientos = await this.seguimientoRepo.find({
            where: { seguidorId: userId },
            select: ['hermandadId'],
        });
        return [
            ...new Set(
                seguimientos
                    .map((s) => s.hermandadId)
                    .filter((id): id is number => !!id),
            ),
        ];
    }

    /**
     * @brief Comprueba si el usuario puede ver el itinerario GPS de una procesión.
     */
    private async puedeVerItinerarioProcesion(
        userId: number,
        rol: RolUsuario,
        procesionId: number,
    ): Promise<boolean> {
        if (rol === RolUsuario.ADMIN) return true;

        const procesion = await this.procesionRepo.findOne({
            where: { id: procesionId },
            relations: ['hermandad'],
        });
        if (!procesion?.hermandad) return false;

        const seguimiento = await this.seguimientoRepo.findOne({
            where: {
                seguidorId: userId,
                hermandadId: procesion.hermandad.id,
            },
        });
        return !!seguimiento;
    }

    /**
     * @brief Procesiones con itinerario visible para el usuario (hermandades seguidas).
     */
    async getItinerariosParaSeguidor(userId: number, rol: RolUsuario) {
        if (rol === RolUsuario.ADMIN) {
            return this.procesionRepo.find({
                relations: ['hermandad'],
                order: { fecha: 'ASC', horaSalida: 'ASC' },
            });
        }

        const hermandadIds = await this.getHermandadIdsSeguidas(userId);
        if (hermandadIds.length === 0) {
            throw new ForbiddenException(
                'Debes seguir hermandades para ver itinerarios',
            );
        }

        return this.procesionRepo.find({
            where: { hermandad: { id: In(hermandadIds) } },
            relations: ['hermandad'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
        });
    }

    /**
     * @brief Obtiene los puntos GPS del itinerario de una procesión ordenados por posición.
     */
    async getPuntosItinerario(
        procesionId: number,
        user: Pick<Usuario, 'id' | 'rol'>,
    ) {
        const puede = await this.puedeVerItinerarioProcesion(
            user.id,
            user.rol,
            procesionId,
        );
        if (!puede) {
            throw new ForbiddenException(
                'No sigues a la hermandad de esta procesión',
            );
        }

        const procesion = await this.procesionRepo.findOneBy({ id: procesionId });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        return this.puntoItinerarioRepo.find({
            where: { procesion: { id: procesionId } },
            order: { orden: 'ASC' },
        });
    }

    /**
     * @brief Crea un nuevo itinerario anual para una procesión.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {{ anio: number; horarioSalida?: string; horarioEntrada?: string; recorrido?: string }} dto
     *        - Datos del itinerario; `horarioSalida`, `horarioEntrada` y `recorrido` son opcionales.
     * @returns {Promise<Itinerario>} Itinerario recién creado.
     *
     * @throws {NotFoundException} Si la procesión no existe.
     */
    async createItinerario(
        procesionId: number,
        dto: {
            anio: number;
            horarioSalida?: string;
            horarioEntrada?: string;
            recorrido?: string;
        },
    ) {
        const procesion = await this.procesionRepo.findOneBy({
            id: procesionId,
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nuevo = this.itinerarioRepo.create({ ...dto, procesionId });
        return this.itinerarioRepo.save(nuevo);
    }

    /**
     * @brief Actualiza los datos de un itinerario existente.
     *
     * @param {number} itinerarioId - Identificador del itinerario.
     * @param {{ horarioSalida?: string; horarioEntrada?: string; recorrido?: string }} dto
     *        - Campos a actualizar (todos opcionales).
     * @returns {Promise<Itinerario | null>} Itinerario actualizado o `null` si no existe.
     */
    async updateItinerario(
        itinerarioId: number,
        dto: {
            horarioSalida?: string;
            horarioEntrada?: string;
            recorrido?: string;
        },
    ) {
        await this.itinerarioRepo.update(itinerarioId, dto);
        return this.itinerarioRepo.findOneBy({ id: itinerarioId });
    }

    /**
     * @brief Crea un nuevo paso para una procesión.
     *
     * @param {number} procesionId - Identificador de la procesión.
     * @param {{ nombre: string; tipo?: string; orden?: number; descripcion?: string }} dto
     *        - Datos del paso.
     * @returns {Promise<Paso>} Paso recién creado.
     *
     * @throws {NotFoundException} Si la procesión no existe.
     */
    async createPaso(
        procesionId: number,
        dto: {
            nombre: string;
            tipo?: string;
            orden?: number;
            descripcion?: string;
        },
    ) {
        const procesion = await this.procesionRepo.findOneBy({
            id: procesionId,
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nuevo = this.pasoRepo.create({ ...dto, procesionId });
        return this.pasoRepo.save(nuevo);
    }

    /**
     * @brief Actualiza los datos de un paso existente.
     *
     * @param {number} pasoId - Identificador del paso.
     * @param {Partial<{ nombre: string; tipo: string; orden: number; descripcion: string }>} dto
     *        - Campos a actualizar (todos opcionales).
     * @returns {Promise<Paso | null>} Paso actualizado o `null` si no existe.
     */
    async updatePaso(
        pasoId: number,
        dto: Partial<{
            nombre: string;
            tipo: string;
            orden: number;
            descripcion: string;
        }>,
    ) {
        await this.pasoRepo.update(pasoId, dto);
        return this.pasoRepo.findOneBy({ id: pasoId });
    }

    /**
     * @brief Elimina un paso por su identificador.
     *
     * @param {number} pasoId - Identificador del paso a eliminar.
     * @returns {Promise<Paso>} Paso eliminado.
     *
     * @throws {NotFoundException} Si el paso no existe.
     */
    async removePaso(pasoId: number) {
        const paso = await this.pasoRepo.findOneBy({ id: pasoId });
        if (!paso) throw new NotFoundException('Paso no encontrado');
        return this.pasoRepo.remove(paso);
    }

    /**
     * @brief Obtiene una procesión con sus participaciones filtradas por año.
     *
     * @details
     * Carga la procesión con la relación `participaciones → banda` y filtra
     * en memoria las participaciones que correspondan al año indicado.
     * Si la procesión no existe, devuelve `null` sin lanzar excepción.
     *
     * @param {number} id   - Identificador de la procesión.
     * @param {number} anio - Año por el que filtrar las participaciones.
     * @returns {Promise<Procesion | null>} Procesión con participaciones del año, o `null`.
     */
    async findOneByProcesion(id: number, anio: number) {
        return await this.procesionRepo
            .findOne({
                where: { id },
                relations: { participaciones: { banda: true } },
            })
            .then((procesion) => {
                if (procesion) {
                    procesion.participaciones =
                        procesion.participaciones.filter(
                            (p) => p.anio === anio,
                        );
                }
                return procesion;
            });
    }

    /**
     * @brief Obtiene la ficha completa de una procesión filtrada por año, incluyendo
     *        su itinerario oficial y las bandas participantes de ese año.
     *
     * @details
     * Ejecuta un único QueryBuilder con cuatro LEFT JOINs condicionales. Los JOINs de
     * `itinerarios` y `participaciones` llevan una condición extra (`anio = :anio`) para
     * evitar cargar datos de otros años en la misma consulta (filtro en JOIN, no en WHERE,
     * por lo que la procesión siempre se devuelve aunque no tenga datos ese año).
     *
     * Flujo de validación posterior a la consulta:
     * 1. Si la procesión no existe → `NotFoundException`.
     * 2. Si la procesión existe pero no tiene itinerario ni participaciones para ese año
     *    → `NotFoundException` con mensaje específico del año.
     *
     * @pre   `procesionId` debe corresponder a una procesión existente en base de datos.
     * @post  El objeto devuelto tiene `itinerarios` y `participaciones` acotados al año
     *        solicitado; el resto de años no aparece en la respuesta.
     *
     * @param {number} procesionId - Identificador único de la procesión.
     * @param {number} anio        - Año civil del que se quiere obtener la ficha (p.ej. 2025).
     * @returns {Promise<Procesion>} Procesión enriquecida con itinerario y participaciones del año.
     *
     * @throws {NotFoundException} Si la procesión no existe o no tiene datos para el año indicado.
     *
     * @complexity O(1) al trabajar con clave primaria; el coste real lo determinan los
     *             índices sobre `itinerarios.anio` y `participaciones.anio`.
     *
     * @note El filtrado de año en el JOIN (en vez de un WHERE posterior) evita que TypeORM
     *       descarte la entidad raíz cuando no hay datos del año, manteniendo los metadatos
     *       básicos de la procesión accesibles al llamador.
     *
     * @see ProcesionesController.fichaAnual
     */
    async obtenerFichaPorAnio(procesionId: number, anio: number) {
        const ficha = await this.procesionRepo
            .createQueryBuilder('procesion')
            .leftJoinAndSelect('procesion.hermandad', 'hermandad')
            .leftJoinAndSelect(
                'procesion.itinerarios',
                'itinerario',
                'itinerario.anio = :anio',
                { anio },
            )
            .leftJoinAndSelect(
                'procesion.participaciones',
                'participacion',
                'participacion.anio = :anio',
                { anio },
            )
            .leftJoinAndSelect('participacion.banda', 'banda')
            .where('procesion.id = :procesionId', { procesionId })
            .getOne();

        if (!ficha)
            throw new NotFoundException(
                `Procesión con ID ${procesionId} no encontrada`,
            );

        if (
            ficha.itinerarios.length === 0 &&
            ficha.participaciones.length === 0
        ) {
            throw new NotFoundException(
                `La procesión no tiene datos registrados para el año ${anio}`,
            );
        }

        return ficha;
    }

    /**
     * @brief Busca procesiones aplicando hasta cinco filtros opcionales de forma acumulativa.
     *
     * @details
     * Construye un QueryBuilder dinámico sobre la entidad `Procesion`. Cada parámetro
     * presente añade una cláusula `AND WHERE` independiente (condiciones acumulativas, no
     * excluyentes). Las comparaciones de texto usan `ILIKE` con comodines `%...%` para
     * búsqueda insensible a mayúsculas en PostgreSQL.
     *
     * El grafo de relaciones cargado es:
     * - `procesion → hermandad → ciudad` (para filtrar y mostrar la localidad)
     * - `procesion → participaciones → banda` (para filtrar y mostrar bandas participantes)
     *
     * Si ningún parámetro es proporcionado, devuelve todas las procesiones con sus
     * relaciones cargadas (equivale a `findAll` pero con el grafo completo).
     *
     * @pre   La base de datos debe ser PostgreSQL; `ILIKE` no está disponible en otros motores.
     * @post  El conjunto resultado contiene solo procesiones que cumplen TODOS los filtros indicados.
     *
     * @param {string} [ciudadNombre] - Nombre parcial de la ciudad (búsqueda insensible a mayúsculas).
     * @param {string} [diaSemana]    - Día de la Semana Santa exacto (p.ej. "Madrugada", "Viernes Santo").
     * @param {string} [nombre]       - Nombre parcial de la procesión.
     * @param {string} [hermandad]    - Nombre parcial de la hermandad titular.
     * @param {string} [banda]        - Nombre parcial de alguna banda participante.
     * @returns {Promise<Procesion[]>} Lista de procesiones que satisfacen todos los filtros, con relaciones.
     *
     * @complexity O(n) respecto al número de procesiones; la carga de relaciones (JOIN) puede
     *             incrementar el coste según el volumen de participaciones.
     *
     * @warning La búsqueda por `banda` hace un LEFT JOIN en `participaciones`, lo que puede
     *          devolver duplicados si se combinan varios filtros de banda. Valorar `DISTINCT`
     *          si el front-end lo requiere.
     *
     * @see ProcesionesController.buscar
     */
    async buscarProcesiones(
        ciudadNombre?: string,
        diaSemana?: string,
        nombre?: string,
        hermandad?: string,
        banda?: string,
    ) {
        const query = this.procesionRepo
            .createQueryBuilder('procesion')
            .leftJoinAndSelect('procesion.hermandad', 'hermandad')
            .leftJoinAndSelect('hermandad.ciudad', 'ciudad')
            .leftJoinAndSelect('procesion.participaciones', 'participacion')
            .leftJoinAndSelect('participacion.banda', 'banda');

        if (ciudadNombre) {
            query.andWhere('ciudad.nombre ILIKE :ciudadNombre', {
                ciudadNombre: `%${ciudadNombre}%`,
            });
        }
        if (diaSemana) {
            query.andWhere('procesion.diaSemana = :diaSemana', { diaSemana });
        }
        if (nombre) {
            query.andWhere('procesion.nombre ILIKE :nombre', {
                nombre: `%${nombre}%`,
            });
        }
        if (hermandad) {
            query.andWhere('hermandad.nombre ILIKE :hermandad', {
                hermandad: `%${hermandad}%`,
            });
        }
        if (banda) {
            query.andWhere('banda.nombre ILIKE :banda', {
                banda: `%${banda}%`,
            });
        }

        return await query.getMany();
    }
}
