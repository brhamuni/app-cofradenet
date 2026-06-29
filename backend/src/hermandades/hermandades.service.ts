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

    async findByUsuario(usuarioId: number) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { usuarioId },
            relations: ['ciudad', 'procesiones'],
        });
        if (!hermandad) throw new NotFoundException('No tienes ninguna hermandad registrada');
        return hermandad;
    }

    async updatePerfil(
        id: number,
        updateDto: UpdateHermandadDto,
        user: Usuario,
    ) {
        const hermandad = await this.hermandadRepo.findOne({
            where: { id },
            relations: ['usuario'],
        });

        if (!hermandad) {
            throw new NotFoundException(
                'La hermandad que intentas editar no existe',
            );
        }

        const esAdmin = user.rol === RolUsuario.ADMIN;
        const esPropietario =
            user.rol === RolUsuario.HERMANDAD &&
            hermandad.usuario?.id === user.id;

        if (!esAdmin && !esPropietario) {
            throw new ForbiddenException(
                'No tienes permiso para gestionar el perfil de esta cofradía',
            );
        }

        Object.assign(hermandad, updateDto);

        return await this.hermandadRepo.save(hermandad);
    }

    remove(id: number) {
        return `This action removes a #${id} hermandade`;
    }

    async updateLogo(id: number, rutaImagen: string, escudoArchivoId?: string) {
        const hermandad = await this.hermandadRepo.findOneBy({ id });

        if (!hermandad) {
            throw new NotFoundException('Hermandad no encontrada');
        }

        hermandad.imagenEscudo = rutaImagen;
        if (escudoArchivoId) hermandad.escudoArchivoId = escudoArchivoId;
        return await this.hermandadRepo.save(hermandad);
    }

    async verificar(id: number, estado: boolean) {
        const hermandad = await this.hermandadRepo.findOneBy({ id });
        if (!hermandad)
            throw new NotFoundException(`Hermandad con ID ${id} no encontrada`);
        hermandad.verificada = estado;
        return await this.hermandadRepo.save(hermandad);
    }
}
