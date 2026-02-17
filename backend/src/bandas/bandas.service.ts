import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';
import { Repository } from 'typeorm';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';

@Injectable()
export class BandasService {
    constructor(
        @InjectRepository(Banda)
        private readonly bandaRepo: Repository<Banda>,
        @InjectRepository(Marcha)
        private readonly marchaRepo: Repository<Marcha>,
        @InjectRepository(Evento)
        private readonly eventoRepo: Repository<Evento>,
    ) {}

    create(createBandaDto: CreateBandaDto) {
        return 'This action adds a new banda';
    }

    findAll() {
        return this.bandaRepo.find();
    }

    async findAllByCiudad(ciudadId: number) {
        return await this.bandaRepo.find({
            where: { ciudadId },
            select: ['id', 'nombre', 'estiloMusical', 'imagenLogo'],
        });
    }

    async findOne(id: number) {
        const banda = await this.bandaRepo.findOne({
            where: { id },
            relations: ['ciudad', 'repertorio'], // Traemos el repertorio (marchas)
        });
        if (!banda) throw new NotFoundException('La banda no existe');
        return banda;
    }

    async update(id: number, updateBandaDto: any, user: any) {
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

        // Actualizamos los datos básicos
        Object.assign(banda, datosRestantes);

        // Si nos pasan IDs de marchas, buscamos las entidades y las vinculamos
        if (repertorioIds) {
            const marchas = await this.marchaRepo.findByIds(repertorioIds);
            banda.repertorio = marchas;
        }

        return await this.bandaRepo.save(banda);
    }

    remove(id: number) {
        return `This action removes a #${id} banda`;
    }

    async crearEvento(bandaId: number, createEventoDto: CreateEventoDto) {
        const banda = await this.bandaRepo.findOneBy({ id: bandaId });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        const nuevoEvento = this.eventoRepo.create({
            ...createEventoDto,
            banda: { id: bandaId },
        });
        return await this.eventoRepo.save(nuevoEvento);
    }

    async obtenerEventos(bandaId: number) {
        return await this.eventoRepo.find({
            where: { banda: { id: bandaId } },
            order: { fechaHora: 'ASC' },
        });
    }
}
