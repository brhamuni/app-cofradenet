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

@Injectable()
export class ProcesionesService {
    constructor(
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,

        @InjectRepository(Hermandad)
        private readonly hermandadRepo: Repository<Hermandad>,
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

    async findOne(id: number) {
        const hoy = new Date().toISOString().split('T')[0];

        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['procesiones'],
        });

        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');

        // Filtramos la procesión más cercana a partir de hoy
        const proximas = hermandad.procesiones
            .filter((p) => p.fecha >= hoy)
            .sort(
                (a, b) =>
                    a.fecha.localeCompare(b.fecha) ||
                    a.horaSalida.localeCompare(b.horaSalida),
            );

        // Asignamos la primera de la lista o sino null
        hermandad.proximaProcesion = proximas.length > 0 ? proximas[0] : null;

        return hermandad;
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

    remove(id: number) {
        return `This action removes a #${id} procesione`;
    }
}
