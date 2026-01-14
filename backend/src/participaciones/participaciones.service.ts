import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateParticipacionDto } from './dto/create-participacion.dto';
import { UpdateParticipacionDto } from './dto/update-participacion.dto';
import { Participacion } from './entities/participacion.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Repository } from 'typeorm/browser';
import { InjectRepository } from '@nestjs/typeorm';
import { Banda } from '@backend/bandas/entities/banda.entity';

@Injectable()
export class ParticipacionesService {
    constructor(
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
        @InjectRepository(Participacion)
        private readonly participacionRepo: Repository<Participacion>,
        @InjectRepository(Banda)
        private readonly bandaRepo: Repository<Banda>,
    ) {}
    create(createParticipacioneDto: CreateParticipacionDto) {
        return 'This action adds a new participacione';
    }

    findAll() {
        return `This action returns all participaciones`;
    }

    findOne(id: number) {
        return `This action returns a #${id} participacione`;
    }

    update(id: number, updateParticipacioneDto: UpdateParticipacionDto) {
        return `This action updates a #${id} participacione`;
    }

    remove(id: number) {
        return `This action removes a #${id} participacione`;
    }
}
