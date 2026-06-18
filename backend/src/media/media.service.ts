import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaItem, TipoMedia } from './entities/media-item.entity';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { ArchivosService } from '@backend/archivos/archivos.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(MediaItem)
        private readonly mediaRepo: Repository<MediaItem>,
        private readonly archivosService: ArchivosService,
        private readonly httpService: HttpService,
    ) {}

    async create(
        dto: CreateMediaItemDto,
        url: string,
        tipo: TipoMedia,
        autorId: number,
        archivoId?: string,
    ): Promise<MediaItem> {
        const item = this.mediaRepo.create({
            ...dto,
            url,
            tipo,
            autorId,
            archivoId: archivoId ?? null,
        });
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
        if (item.archivoId) {
            await this.archivosService.remove(item.archivoId);
        }
        await this.mediaRepo.remove(item);
    }

    async explorar(page = 1, limit = 20, tipo?: TipoMedia): Promise<{ data: MediaItem[]; total: number }> {
        const qb = this.mediaRepo.createQueryBuilder('m')
            .orderBy('m.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (tipo) qb.where('m.tipo = :tipo', { tipo });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async tendencias(): Promise<MediaItem[]> {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return this.mediaRepo.createQueryBuilder('m')
            .where('m.createdAt >= :desde', { desde: hace7Dias })
            .orderBy('m.createdAt', 'DESC')
            .take(12)
            .getMany();
    }

    async reciente(): Promise<MediaItem[]> {
        return this.mediaRepo.find({ order: { createdAt: 'DESC' }, take: 8 });
    }

    async oembed(url: string): Promise<any> {
        let apiUrl: string;

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            apiUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        } else if (url.includes('instagram.com')) {
            apiUrl = `https://graph.facebook.com/v14.0/instagram_oembed?url=${encodeURIComponent(url)}&format=json`;
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            apiUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
        } else {
            throw new BadRequestException('Plataforma no soportada para oEmbed');
        }

        try {
            const { data } = await firstValueFrom(this.httpService.get(apiUrl));
            return data;
        } catch {
            throw new BadRequestException('No se pudo obtener el embed para esta URL');
        }
    }
}
