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
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class HermandadesService {
    constructor(
        @InjectRepository(Hermandad)
        private readonly hermandadRepo: Repository<Hermandad>,
        @InjectRepository(Ciudad)
        private readonly ciudadRepo: Repository<Ciudad>,
    ) {}

    async create(createHermandadDto: CreateHermandadDto) {
        const ciudad = await this.ciudadRepo.findOneBy({
            id: createHermandadDto.ciudadId,
        });

        if (!ciudad) {
            throw new NotFoundException(
                'La ciudad con ID ${createHermandadDto.ciudadId} no existe',
            );
        }

        const hermandad = this.hermandadRepo.create({
            ...createHermandadDto,
            ciudad: ciudad,
        });
        return this.hermandadRepo.save(hermandad);
    }

    async findAll() {
        return await this.hermandadRepo.find({
            relations: ['ciudad', 'usuario'],
        });
    }

    async findOne(id: number) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['ciudad', 'procesiones'],
        });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');
        return hermandad;
    }

    async updatePerfil(id: number, updateDto: UpdateHermandadDto, user: any) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['usuario'],
        });

        if (!hermandad) {
            throw new NotFoundException(
                'La hermandad que intentas editar no existe',
            );
        }

        // SEGURIDAD: Comprobamos si es el dueño o un administrador global
        if (
            user.rol !== RolUsuario.HERMANDAD ||
            (user.rol !== RolUsuario.ADMIN && hermandad.usuario?.id !== user.id)
        ) {
            throw new ForbiddenException(
                'No tienes permiso para gestionar el perfil de esta cofradía',
            );
        }

        // Actualizamos los campos recibidos
        Object.assign(hermandad, updateDto);

        return await this.hermandadRepo.save(hermandad);
    }

    remove(id: number) {
        return `This action removes a #${id} hermandade`;
    }
}
