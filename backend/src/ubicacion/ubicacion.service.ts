import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UbicacionTiempoReal } from './entities/ubicacion-tiempo-real.entity';
import { EstadoPaso } from './entities/estado-paso.entity';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CreateEstadoPasoDto } from './dto/create-estado-paso.dto';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class UbicacionService {
    constructor(
        @InjectRepository(UbicacionTiempoReal)
        private readonly ubicacionRepo: Repository<UbicacionTiempoReal>,
        @InjectRepository(EstadoPaso)
        private readonly estadoPasoRepo: Repository<EstadoPaso>,
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
    ) {}

    async getActivas() {
        return this.ubicacionRepo.find({
            where: { estaActiva: true },
            relations: ['procesion', 'procesion.hermandad'],
        });
    }

    async getByProcesion(procesionId: number) {
        return this.ubicacionRepo.findOne({
            where: { procesionId },
        });
    }

    async updateUbicacion(procesionId: number, dto: UpdateUbicacionDto, user: any) {
        const procesion = await this.procesionRepo.findOne({
            where: { id: procesionId },
            relations: ['hermandad'],
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');

        const isOwner = procesion.hermandad?.usuarioId === user.id;
        const isAdmin = user.rol === RolUsuario.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Solo el administrador de la hermandad puede compartir la ubicación');
        }

        let ubicacion = await this.ubicacionRepo.findOne({ where: { procesionId } });
        if (!ubicacion) {
            ubicacion = this.ubicacionRepo.create({ procesionId });
        }

        if (dto.latitud !== undefined) ubicacion.latitud = dto.latitud;
        if (dto.longitud !== undefined) ubicacion.longitud = dto.longitud;
        ubicacion.estaActiva = dto.estaActiva;
        ubicacion.compartidoPorId = user.id;

        return this.ubicacionRepo.save(ubicacion);
    }

    async createEstadoPaso(procesionId: number, dto: CreateEstadoPasoDto, userId: number) {
        const estado = this.estadoPasoRepo.create({
            procesionId,
            nombrePaso: dto.nombrePaso,
            estado: dto.estado,
            latitud: dto.latitud,
            longitud: dto.longitud,
            autorId: userId,
        });
        return this.estadoPasoRepo.save(estado);
    }

    async getEstadosPaso(procesionId: number) {
        return this.estadoPasoRepo.find({
            where: { procesionId },
            order: { createdAt: 'DESC' },
            take: 30,
        });
    }
}
