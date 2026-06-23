import { Injectable } from '@nestjs/common';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Evento } from './entities/evento.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EventosService {
    constructor(
        @InjectRepository(Evento)
        private readonly eventoRepository: Repository<Evento>,
    ) {}

    async create(createEventoDto: CreateEventoDto) {
        const nuevoEvento = this.eventoRepository.create(createEventoDto);
        return await this.eventoRepository.save(nuevoEvento);
    }

    async findAllByBanda(bandaId: number, anio: number) {
        // Buscamos eventos que coincidan con la banda y el año
        return await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.bandaId = :bandaId', { bandaId })
            .andWhere('EXTRACT(YEAR FROM evento.fecha) = :anio', { anio })
            .orderBy('evento.fecha', 'ASC')
            .getMany();
    }

    findAll() {
        return `This action returns all eventos`;
    }

    findOne(id: number) {
        return `This action returns a #${id} evento`;
    }

    update(id: number, _updateEventoDto: UpdateEventoDto) {
        return `This action updates a #${id} evento`;
    }

    remove(id: number) {
        return `This action removes a #${id} evento`;
    }
}
