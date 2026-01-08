import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hermandad } from './entities/hermandad.entity';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class HermandadesService {
    constructor(
        @InjectRepository(Hermandad)
        private readonly hermandadRepository: Repository<Hermandad>,
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
    ) {}

    async create(createHermandadDto: CreateHermandadDto) {
        const ciudad = await this.ciudadRepository.findOneBy({
            id: createHermandadDto.ciudadId,
        });

        if (!ciudad) {
            throw new NotFoundException(
                'La ciudad con ID ${createHermandadDto.ciudadId} no existe',
            );
        }

        const hermandad = this.hermandadRepository.create({
            ...createHermandadDto,
            ciudad: ciudad,
        });
        return this.hermandadRepository.save(hermandad);
    }

    async findAll() {
        return await this.hermandadRepository.find({
            relations: ['ciudad', 'usuario'],
        });
    }

    findOne(id: number) {
        return `This action returns a #${id} hermandade`;
    }

    async updatePerfil(usuarioId: number, updateDto: UpdateHermandadDto) {
        // 1. Buscamos la hermandad cuyo administrador sea el usuario logueado
        const hermandad = await this.hermandadRepository.findOne({
            where: { usuario: { id: usuarioId } },
        });

        // 2. Si no existe, lanzamos un error claro
        if (!hermandad) {
            throw new NotFoundException(
                `No se encontró una hermandad gestionada por el usuario con ID ${usuarioId}`,
            );
        }

        Object.assign(hermandad, updateDto);

        // 4. Guardamos y devolvemos la entidad actualizada
        return await this.hermandadRepository.save(hermandad);
    }

    remove(id: number) {
        return `This action removes a #${id} hermandade`;
    }
}
