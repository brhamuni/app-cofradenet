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

        if (!procesion.hermandad.usuario || procesion.hermandad.usuario.id !== user.id) {
            throw new ForbiddenException('No tienes permiso para borrar esta procesión');
        }

        await this.procesionRepo.remove(procesion);
        return { message: 'Procesión eliminada correctamente' };
    }

    async asignarBanda(procesionId: number, bandaId: number, anio: number, ubicacion: string) {
        const procesion = await this.procesionRepo.findOne({ where: { id: procesionId } });
        if (!procesion) throw new NotFoundException('No se ha podido encontrar ninguna procesion');

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

    async addParticipacion(procesionId: number, dto: { bandaId: number; anio: number; ubicacion?: string }) {
        const procesion = await this.procesionRepo.findOneBy({ id: procesionId });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nueva = this.participacionRepo.create({ ...dto, procesionId });
        return this.participacionRepo.save(nueva);
    }

    async updateParticipacion(pid: number, dto: Partial<{ bandaId: number; anio: number; ubicacion: string }>) {
        await this.participacionRepo.update(pid, dto);
        return this.participacionRepo.findOne({ where: { id: pid }, relations: ['banda'] });
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

    async createItinerario(procesionId: number, dto: { anio: number; horarioSalida?: string; horarioEntrada?: string; recorrido?: string }) {
        const procesion = await this.procesionRepo.findOneBy({ id: procesionId });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nuevo = this.itinerarioRepo.create({ ...dto, procesionId });
        return this.itinerarioRepo.save(nuevo);
    }

    async updateItinerario(itinerarioId: number, dto: { horarioSalida?: string; horarioEntrada?: string; recorrido?: string }) {
        await this.itinerarioRepo.update(itinerarioId, dto);
        return this.itinerarioRepo.findOneBy({ id: itinerarioId });
    }

    // --- Pasos (HUAH-02) ---

    async createPaso(procesionId: number, dto: { nombre: string; tipo?: string; orden?: number; descripcion?: string }) {
        const procesion = await this.procesionRepo.findOneBy({ id: procesionId });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const nuevo = this.pasoRepo.create({ ...dto, procesionId });
        return this.pasoRepo.save(nuevo);
    }

    async updatePaso(pasoId: number, dto: Partial<{ nombre: string; tipo: string; orden: number; descripcion: string }>) {
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
                    procesion.participaciones = procesion.participaciones.filter((p) => p.anio === anio);
                }
                return procesion;
            });
    }

    async obtenerFichaPorAnio(procesionId: number, anio: number) {
        const ficha = await this.procesionRepo
            .createQueryBuilder('procesion')
            .leftJoinAndSelect('procesion.hermandad', 'hermandad')
            .leftJoinAndSelect('procesion.itinerarios', 'itinerario', 'itinerario.anio = :anio', { anio })
            .leftJoinAndSelect('procesion.participaciones', 'participacion', 'participacion.anio = :anio', { anio })
            .leftJoinAndSelect('participacion.banda', 'banda')
            .where('procesion.id = :procesionId', { procesionId })
            .getOne();

        if (!ficha) throw new NotFoundException(`Procesión con ID ${procesionId} no encontrada`);

        if (ficha.itinerarios.length === 0 && ficha.participaciones.length === 0) {
            throw new NotFoundException(`La procesión no tiene datos registrados para el año ${anio}`);
        }

        return ficha;
    }

    async buscarProcesiones(ciudadNombre?: string, diaSemana?: string, nombre?: string, hermandad?: string, banda?: string) {
        const query = this.procesionRepo
            .createQueryBuilder('procesion')
            .leftJoinAndSelect('procesion.hermandad', 'hermandad')
            .leftJoinAndSelect('hermandad.ciudad', 'ciudad')
            .leftJoinAndSelect('procesion.participaciones', 'participacion')
            .leftJoinAndSelect('participacion.banda', 'banda');

        if (ciudadNombre) {
            query.andWhere('ciudad.nombre ILIKE :ciudadNombre', { ciudadNombre: `%${ciudadNombre}%` });
        }
        if (diaSemana) {
            query.andWhere('procesion.diaSemana = :diaSemana', { diaSemana });
        }
        if (nombre) {
            query.andWhere('procesion.nombre ILIKE :nombre', { nombre: `%${nombre}%` });
        }
        if (hermandad) {
            query.andWhere('hermandad.nombre ILIKE :hermandad', { hermandad: `%${hermandad}%` });
        }
        if (banda) {
            query.andWhere('banda.nombre ILIKE :banda', { banda: `%${banda}%` });
        }

        return await query.getMany();
    }
}
