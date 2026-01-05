import { Injectable } from '@nestjs/common';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudad } from './entities/ciudad.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { Like } from 'typeorm';

@Injectable()
export class CiudadesService {
    constructor(
        @InjectRepository(Ciudad)
        private ciudadRepository: Repository<Ciudad>,
    ) {}

    async buscarPorNombre(ciudad: string): Promise<Ciudad[]> {
        return await this.ciudadRepository.find({
            where: {
                nombre: Like(`%${ciudad}%`),
            },
        });
    }

    create(createCiudadeDto: CreateCiudadeDto) {
        return 'This action adds a new ciudade';
    }

    findAll() {
        return this.ciudadRepository.find();
    }

    findOne(id: number) {
        return `This action returns a #${id} ciudade`;
    }

    update(id: number, updateCiudadeDto: UpdateCiudadeDto) {
        return `This action updates a #${id} ciudade`;
    }

    remove(id: number) {
        return `This action removes a #${id} ciudade`;
    }
}
