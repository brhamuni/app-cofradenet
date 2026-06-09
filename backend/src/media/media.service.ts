import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaItem, TipoMedia } from './entities/media-item.entity';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(MediaItem)
        private readonly mediaRepo: Repository<MediaItem>,
    ) {}

    async create(dto: CreateMediaItemDto, url: string, tipo: TipoMedia, autorId: number): Promise<MediaItem> {
        const item = this.mediaRepo.create({ ...dto, url, tipo, autorId });
        return this.mediaRepo.save(item);
    }

    async findByHermandad(hermandadId: number): Promise<MediaItem[]> {
        return this.mediaRepo.find({
            where: { hermandadId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByBanda(bandaId: number): Promise<MediaItem[]> {
        return this.mediaRepo.find({
            where: { bandaId },
            order: { createdAt: 'DESC' },
        });
    }

    async findPublicos(filters: {
        hermandadId?: number;
        bandaId?: number;
        ciudadId?: number;
        anio?: number;
    }): Promise<MediaItem[]> {
        const query = this.mediaRepo.createQueryBuilder('m')
            .orderBy('m.createdAt', 'DESC')
            .take(50);

        if (filters.hermandadId) query.andWhere('m.hermandadId = :hermandadId', { hermandadId: filters.hermandadId });
        if (filters.bandaId) query.andWhere('m.bandaId = :bandaId', { bandaId: filters.bandaId });
        if (filters.ciudadId) query.andWhere('m.ciudadId = :ciudadId', { ciudadId: filters.ciudadId });
        if (filters.anio) query.andWhere('m.anio = :anio', { anio: filters.anio });

        return query.getMany();
    }

    async remove(id: number, user: any): Promise<void> {
        const item = await this.mediaRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Media no encontrado');
        if (item.autorId !== user.id && user.rol !== RolUsuario.ADMIN) {
            throw new ForbiddenException('Sin permisos para eliminar este media');
        }
        await this.mediaRepo.remove(item);
    }
}
