import { Injectable } from '@nestjs/common';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudad } from './entities/ciudad.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class CiudadesService {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
    ) {}

    async buscarPorNombre(nombre: string): Promise<Ciudad[]> {
        if (!nombre || nombre.trim() === '') {
            return [];
        }

        return await this.ciudadRepository.find({
            where: {
                nombre: ILike(`%${nombre}%`),
            },
            order: {
                nombre: 'ASC',
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
