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

    async create(createCiudadeDto: CreateCiudadeDto) {
        const nuevaCiudad = this.ciudadRepo.create(createCiudadeDto);
        return await this.ciudadRepo.save(nuevaCiudad);
    }

    async findAll() {
        return this.ciudadRepo.find();
    }

    async findOne(id: number) {
        const ciudad = await this.ciudadRepo.findOneBy({ id });
        if (!ciudad) throw new NotFoundException('Ciudad no encontrada');
        return ciudad;
    }

    async update(id: number, updateCiudadeDto: UpdateCiudadeDto) {
        const ciudad = await this.ciudadRepo.findOneBy({ id });
        if (!ciudad) throw new NotFoundException('Ciudad no encontrada');
        Object.assign(ciudad, updateCiudadeDto);
        return await this.ciudadRepo.save(ciudad);
    }

    async remove(id: number) {
        await this.ciudadRepo.delete(id);
    }
}
