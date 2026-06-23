import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParticipacionDto } from './dto/create-participacion.dto';
import { UpdateParticipacionDto } from './dto/update-participacion.dto'; // <-- Revisa que este nombre coincida con tu archivo
import { Participacion } from './entities/participacion.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';

@Injectable()
export class ParticipacionesService {
    constructor(
        @InjectRepository(Participacion)
        private readonly participacionRepository: Repository<Participacion>,
        @InjectRepository(Procesion)
        private readonly procesionesRepo: Repository<Procesion>,
    ) {}

    async create(createParticipacionDto: CreateParticipacionDto) {
        // TypeORM necesita que los datos coincidan con la Entidad
        const nueva = this.participacionRepository.create(
            createParticipacionDto,
        );
        return await this.participacionRepository.save(nueva);
    }

    findAll() {
        return this.participacionRepository.find({
            relations: ['banda', 'procesion'],
        });
    }

    findOne(id: number) {
        return this.participacionRepository.findOne({
            where: { id },
            relations: ['banda', 'procesion'],
        });
    }

    async update(id: number, updateParticipacionDto: UpdateParticipacionDto) {
        await this.participacionRepository.update(id, updateParticipacionDto);
        return this.findOne(id);
    }

    // CAMBIA string por number aquí 👇
    async remove(id: number) {
        const participacion = await this.findOne(id);
        if (participacion) {
            return await this.participacionRepository.remove(participacion);
        }
    }
}
