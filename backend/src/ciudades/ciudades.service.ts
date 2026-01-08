import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudad } from './entities/ciudad.entity';
import { ILike, Repository, Like } from 'typeorm';

@Injectable()
export class CiudadesService {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadRepo: Repository<Ciudad>,
    ) {}

    async buscarPorNombre(nombre: string): Promise<Ciudad[]> {
        if (!nombre || nombre.trim() === '') {
            return [];
        }

        return await this.ciudadRepo.find({
            where: {
                nombre: ILike(`%${nombre}%`),
            },
            order: {
                nombre: 'ASC',
            },
        });
    }

    async buscarHermandadesPorCiudad(nombreCiudad: string) {
        const ciudad = await this.ciudadRepo.findOne({
            where: { nombre: Like(`%${nombreCiudad}%`) },
            relations: ['hermandades'],
        });

        if (!ciudad) {
            throw new NotFoundException('Ciudad no encontrada');
        }

        return ciudad.hermandades;
    }

    create(createCiudadeDto: CreateCiudadeDto) {
        const nuevaCiudad = this.ciudadRepo.create(createCiudadeDto);
        return this.ciudadRepo.save(nuevaCiudad);
    }

    findAll() {
        return this.ciudadRepo.find();
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
