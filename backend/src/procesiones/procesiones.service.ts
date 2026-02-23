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
    ) {}

    async create(createProcesionDto: CreateProcesionDto, req: any) {
        const { hermandadId, ...datosProcesion } = createProcesionDto;

        if (req.rol === RolUsuario.HERMANDAD) {
            const hermandadPropia = await this.hermandadRepo.findOne({
                where: { usuario: { id: req.id } as Usuario },
            });

            // Si la hermandad que intenta crear no es la suya, bloqueamos
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
            where: {
                hermandad: { id: id },
            },
            // Traemos el itinerario por si el frontend quiere mostrar los mapas en el listado
            relations: ['itinerario'],
            // Ordenamos: primero lo más próximo en el calendario
            order: {
                fecha: 'ASC',
                horaSalida: 'ASC',
            },
        });
    }

    async findOne(id: number) {
        const procesion = await this.procesionRepo.findOne({
            where: { id },
            relations: ['hermandad', 'itinerario'],
        });

        if (!procesion) throw new NotFoundException('La procesión no existe');

        // Nos aseguramos de que el itinerario vaya siempre ordenado para el mapa
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
            order: {
                fecha: 'ASC',
                horaSalida: 'ASC',
            },
            take: 10,
        });
    }

    update(id: number, updateProcesionDto: UpdateProcesionDto) {
        return `This action updates a #${id} procesione`;
    }

    async remove(id: number, user: any) {
        // 1. Cargamos la procesión y la relación 'usuario' dentro de 'hermandad'
        const procesion = await this.procesionRepo.findOne({
            where: { id },
            relations: ['hermandad', 'hermandad.usuario'], // <--- Cambiado a 'usuario'
        });

        if (!procesion) {
            throw new NotFoundException('Procesión no encontrada');
        }

        // 2. Verificamos permisos
        // Si es ADMIN, permitimos borrar siempre
        if (user.rol === RolUsuario.ADMIN) {
            await this.procesionRepo.remove(procesion);
            return { message: 'Procesión eliminada por el administrador' };
        }

        // 3. Si es HERMANDAD, comprobamos que el ID del usuario de la hermandad
        // coincida con el ID del usuario logueado (req.user.id)
        if (
            !procesion.hermandad.usuario ||
            procesion.hermandad.usuario.id !== user.id
        ) {
            throw new ForbiddenException(
                'No tienes permiso para borrar esta procesión',
            );
        }

        // 4. Borrado físico (esto borrará también los puntos_itinerario por el cascade)
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

        if (!procesion) {
            throw new NotFoundException(
                'No se ha podido encontrar ninguna procesion',
            );
        }

        const banda = await this.bandaRepo.findOne({
            where: { id: bandaId },
        });

        const nuevaParticipacion = this.participacionRepo.create({
            procesion: { id: procesionId },
            banda: { id: bandaId },
            anio,
            ubicacion,
        });

        return await this.participacionRepo.save(nuevaParticipacion);
    }

    async findOneByProcesion(id: number, anio: number) {
        return await this.procesionRepo
            .findOne({
                where: { id },
                relations: {
                    participaciones: {
                        banda: true,
                    },
                },
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

        if (!ficha) {
            throw new NotFoundException(
                `Procesión con ID ${procesionId} no encontrada`,
            );
        }

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

    async buscarProcesiones(
        ciudadNombre?: string, // Cambiado a string
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

        // Filtro por NOMBRE de Ciudad
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
