import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateProcesionDto as CreateProcesionDto } from './dto/create-procesion.dto';
import { UpdateProcesionDto } from './dto/update-procesion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Procesion } from './entities/procesion.entity';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Itinerario } from '@backend/itinerarios/entities/itinerario.entity';
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
    ) {}

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

    findAll() {
        return this.procesionRepo.find({
            relations: ['hermandad', 'itinerario'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
        });
    }

    async buscarPorHermandad(id: number) {
        return await this.procesionRepo.find({
            where: { hermandad: { id: id } },
            relations: ['itinerario'],
            order: { fecha: 'ASC', horaSalida: 'ASC' },
        });
    }

    async findOne(id: number) {
        const procesion = await this.procesionRepo.findOne({
            where: { id },
            relations: ['hermandad', 'itinerario'],
        });

        if (!procesion) throw new NotFoundException('La procesión no existe');

        procesion.itinerario.sort((a, b) => a.orden - b.orden);

        return procesion;
    }

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

    update(id: number, updateProcesionDto: UpdateProcesionDto) {
        return `This action updates a #${id} procesione`;
    }

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

    // --- Participaciones (HUR-07) ---

    async getParticipaciones(procesionId: number) {
        return this.participacionRepo.find({
            where: { procesionId },
            relations: ['banda'],
            order: { anio: 'DESC' },
        });
    }

    async addParticipacion(
        procesionId: number,
        dto: { bandaId: number; anio: number; ubicacion?: string },
    ) {
        const procesion = await this.procesionRepo.findOneBy({
            id: procesionId,
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nueva = this.participacionRepo.create({ ...dto, procesionId });
        return this.participacionRepo.save(nueva);
    }

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

    async removeParticipacion(pid: number) {
        const p = await this.participacionRepo.findOneBy({ id: pid });
        if (!p) throw new NotFoundException('Participación no encontrada');
        return this.participacionRepo.remove(p);
    }

    // --- Itinerario (HUAH-02) ---

    async getItinerarios(procesionId: number) {
        return this.itinerarioRepo.find({
            where: { procesionId },
            order: { anio: 'DESC' },
        });
    }

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

    // --- Pasos (HUAH-02) ---

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

    async removePaso(pasoId: number) {
        const paso = await this.pasoRepo.findOneBy({ id: pasoId });
        if (!paso) throw new NotFoundException('Paso no encontrado');
        return this.pasoRepo.remove(paso);
    }

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
     * @note El filtrado año en el JOIN (en vez de un WHERE posterior) evita que TypeORM
     *       descarte la entidad raíz cuando no hay datos del año, manteniendo los metadatos
     *       básicos de la procesión accesibles al llamador.
     *
     * @see buscarProcesiones
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
     * @see https://typeorm.io/#/select-query-builder
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
