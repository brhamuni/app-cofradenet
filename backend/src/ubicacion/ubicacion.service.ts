import { ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UbicacionTiempoReal } from './entities/ubicacion-tiempo-real.entity';
import { EstadoPaso } from './entities/estado-paso.entity';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CreateEstadoPasoDto } from './dto/create-estado-paso.dto';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { UbicacionGateway } from './ubicacion.gateway';

@Injectable()
export class UbicacionService {
    constructor(
        @InjectRepository(UbicacionTiempoReal)
        private readonly ubicacionRepo: Repository<UbicacionTiempoReal>,
        @InjectRepository(EstadoPaso)
        private readonly estadoPasoRepo: Repository<EstadoPaso>,
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
        @Inject(forwardRef(() => UbicacionGateway))
        private readonly gateway: UbicacionGateway,
    ) {}

    async assertHermandadOwner(procesionId: number, user: any) {
        const procesion = await this.procesionRepo.findOne({
            where: { id: procesionId },
            relations: ['hermandad'],
        });
        if (!procesion) throw new NotFoundException('Procesión no encontrada');
        const isOwner = procesion.hermandad?.usuarioId === user.id;
        const isAdmin = user.rol === RolUsuario.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Solo el administrador de la hermandad puede realizar esta acción');
        }
        return procesion;
    }

    async getActivas() {
        return this.ubicacionRepo.find({
            where: { estaActiva: true },
            relations: ['procesion', 'procesion.hermandad'],
        });
    }

    async getByProcesion(procesionId: number) {
        return this.ubicacionRepo.findOne({ where: { procesionId } });
    }

    async iniciar(procesionId: number, user: any) {
        await this.assertHermandadOwner(procesionId, user);
        let ubicacion = await this.ubicacionRepo.findOne({ where: { procesionId } });
        if (!ubicacion) {
            ubicacion = this.ubicacionRepo.create({ procesionId });
        }
        ubicacion.estaActiva = true;
        ubicacion.compartidoPorId = user.id;
        return this.ubicacionRepo.save(ubicacion);
    }

    async finalizar(procesionId: number, user: any) {
        await this.assertHermandadOwner(procesionId, user);
        const ubicacion = await this.ubicacionRepo.findOne({ where: { procesionId } });
        if (!ubicacion) throw new NotFoundException('Ubicación no encontrada');
        ubicacion.estaActiva = false;
        return this.ubicacionRepo.save(ubicacion);
    }

    async updateUbicacion(procesionId: number, dto: UpdateUbicacionDto, user: any) {
        await this.assertHermandadOwner(procesionId, user);
        let ubicacion = await this.ubicacionRepo.findOne({ where: { procesionId } });
        if (!ubicacion) {
            ubicacion = this.ubicacionRepo.create({ procesionId });
        }
        if (dto.latitud !== undefined) ubicacion.latitud = dto.latitud;
        if (dto.longitud !== undefined) ubicacion.longitud = dto.longitud;
        if (dto.estaActiva !== undefined) ubicacion.estaActiva = dto.estaActiva;
        ubicacion.compartidoPorId = user.id;
        const saved = await this.ubicacionRepo.save(ubicacion);
        this.gateway.emitUbicacionActualizada(procesionId, saved);
        return saved;
    }

    async getEstadosPaso(procesionId: number, pasoId?: number) {
        const where: any = { procesionId };
        if (pasoId !== undefined) where.pasoId = pasoId;
        return this.estadoPasoRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
            relations: ['paso'],
        });
    }

    async getUltimoEstadoPaso(procesionId: number, pasoId: number) {
        return this.estadoPasoRepo.findOne({
            where: { procesionId, pasoId },
            order: { createdAt: 'DESC' },
            relations: ['paso'],
        });
    }

    async createEstadoPaso(procesionId: number, pasoId: number, dto: CreateEstadoPasoDto, userId: number) {
        const estado = this.estadoPasoRepo.create({
            procesionId,
            pasoId: dto.pasoId ?? pasoId,
            estado: dto.estado,
            latitud: dto.latitud,
            longitud: dto.longitud,
            autorId: userId,
        });
        const saved = await this.estadoPasoRepo.save(estado);
        this.gateway.emitEstadoPasoActualizado(procesionId, saved);
        return saved;
    }

    async deleteEstadoPaso(estadoId: number, user: any) {
        const estado = await this.estadoPasoRepo.findOne({
            where: { id: estadoId },
            relations: ['procesion', 'procesion.hermandad'],
        });
        if (!estado) throw new NotFoundException('Estado de paso no encontrado');
        const isOwner = estado.procesion?.hermandad?.usuarioId === user.id;
        const isAdmin = user.rol === RolUsuario.ADMIN;
        const isAuthor = estado.autorId === user.id;
        if (!isOwner && !isAdmin && !isAuthor) {
            throw new ForbiddenException('Sin permisos para eliminar este estado');
        }
        await this.estadoPasoRepo.remove(estado);
    }
}
