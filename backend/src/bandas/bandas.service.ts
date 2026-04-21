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
import { Participacion } from '@backend/participaciones/entities/participacion.entity';

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
    ) {}

    async create(createBandaDto: CreateBandaDto) {
        const nuevaBanda = this.bandaRepo.create(createBandaDto);
        return await this.bandaRepo.save(nuevaBanda);
    }

    findAll() {
        return this.bandaRepo.find({ relations: ['usuario', 'ciudad'] });
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
            relations: ['ciudad', 'repertorio', 'eventos'],
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

    async findAgenda(bandaId: number, anio: number): Promise<any[]> {
        // 1. Buscamos las procesiones (Participaciones)
        const procesiones = await this.participacionRepo.find({
            where: { bandaId, anio },
            relations: ['procesion', 'procesion.hermandad'],
        });

        // 2. Buscamos los eventos de la banda
        // Usamos el Repositorio de Eventos (necesitarás inyectarlo en el constructor)
        const eventos = await this.eventoRepo.find({
            where: { bandaId },
            // Filtramos por año de forma sencilla (o usando TypeORM operators)
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

    async verificar(id: number, estado: boolean) {
        const banda = await this.bandaRepo.findOneBy({ id });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        banda.verificada = estado;
        return await this.bandaRepo.save(banda);
    }
}
