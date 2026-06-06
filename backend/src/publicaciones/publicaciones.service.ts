import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Publicacion } from './entities/publicacion.entity';
import { MeGusta } from './entities/me-gusta.entity';
import { Comentario } from './entities/comentario.entity';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { Usuario, RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class PublicacionesService {
    constructor(
        @InjectRepository(Publicacion)
        private readonly repo: Repository<Publicacion>,
        @InjectRepository(MeGusta)
        private readonly meGustaRepo: Repository<MeGusta>,
        @InjectRepository(Comentario)
        private readonly comentarioRepo: Repository<Comentario>,
        @InjectRepository(Seguimiento)
        private readonly seguimientoRepo: Repository<Seguimiento>,
    ) {}

    async create(dto: CreatePublicacionDto, autor: Usuario): Promise<Publicacion> {
        const publicacion = this.repo.create({ ...dto, autorId: autor.id });
        return this.repo.save(publicacion);
    }

    private buildQuery(alias = 'p') {
        return this.repo.createQueryBuilder(alias)
            .leftJoinAndSelect(`${alias}.autor`, 'autor')
            .leftJoinAndSelect(`${alias}.hermandad`, 'hermandad')
            .leftJoinAndSelect(`${alias}.banda`, 'banda')
            .loadRelationCountAndMap(`${alias}.likesCount`, `${alias}.meGustas`)
            .loadRelationCountAndMap(`${alias}.comentariosCount`, `${alias}.comentarios`);
    }

    findByHermandad(hermandadId: number): Promise<any[]> {
        return this.buildQuery()
            .where('p.hermandadId = :id', { id: hermandadId })
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    findByBanda(bandaId: number): Promise<any[]> {
        return this.buildQuery()
            .where('p.bandaId = :id', { id: bandaId })
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    findByUsuario(autorId: number): Promise<any[]> {
        return this.buildQuery()
            .where('p.autorId = :id AND p.hermandadId IS NULL AND p.bandaId IS NULL', { id: autorId })
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    async getFeed(userId: number, page = 1, limit = 20): Promise<{ publicaciones: any[]; total: number; page: number; limit: number }> {
        const seguimientos = await this.seguimientoRepo.find({ where: { seguidorId: userId } });

        const hermandadIds = seguimientos.filter((s) => s.hermandadId).map((s) => s.hermandadId);
        const bandaIds = seguimientos.filter((s) => s.bandaId).map((s) => s.bandaId);

        if (hermandadIds.length === 0 && bandaIds.length === 0) {
            return { publicaciones: [], total: 0, page, limit };
        }

        const qb = this.buildQuery();
        const conditions: string[] = [];
        if (hermandadIds.length) conditions.push('p.hermandadId IN (:...hermandadIds)');
        if (bandaIds.length) conditions.push('p.bandaId IN (:...bandaIds)');

        qb.where(`(${conditions.join(' OR ')})`, {
            ...(hermandadIds.length ? { hermandadIds } : {}),
            ...(bandaIds.length ? { bandaIds } : {}),
        })
            .orderBy('p.fechaCreacion', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [publicaciones, total] = await qb.getManyAndCount();

        // Enrich with userLiked
        const publicacionIds = publicaciones.map((p) => (p as any).id);
        const likes = publicacionIds.length
            ? await this.meGustaRepo.find({ where: { usuarioId: userId, publicacionId: In(publicacionIds) } })
            : [];
        const likedSet = new Set(likes.map((l) => l.publicacionId));
        const enriched = publicaciones.map((p) => ({ ...(p as any), userLiked: likedSet.has((p as any).id) }));

        return { publicaciones: enriched, total, page, limit };
    }

    async getGeneral(userId: number | undefined, page = 1, limit = 20): Promise<{ publicaciones: any[]; total: number; page: number; limit: number }> {
        const qb = this.buildQuery()
            .orderBy('p.fechaCreacion', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [publicaciones, total] = await qb.getManyAndCount();

        if (userId) {
            const publicacionIds = publicaciones.map((p) => (p as any).id);
            const likes = publicacionIds.length
                ? await this.meGustaRepo.find({ where: { usuarioId: userId, publicacionId: In(publicacionIds) } })
                : [];
            const likedSet = new Set(likes.map((l) => l.publicacionId));
            const enriched = publicaciones.map((p) => ({ ...(p as any), userLiked: likedSet.has((p as any).id) }));
            return { publicaciones: enriched, total, page, limit };
        }

        return { publicaciones, total, page, limit };
    }

    async remove(id: number, usuario: Usuario): Promise<void> {
        const pub = await this.repo.findOne({ where: { id } });
        if (!pub) throw new NotFoundException('Publicación no encontrada');
        if (usuario.rol !== RolUsuario.ADMIN && pub.autorId !== usuario.id) {
            throw new ForbiddenException('No puedes eliminar esta publicación');
        }
        await this.repo.remove(pub);
    }

    // ── Me gusta ─────────────────────────────────────────────────────────────

    async toggleLike(userId: number, publicacionId: number): Promise<{ liked: boolean; count: number }> {
        const existing = await this.meGustaRepo.findOne({ where: { usuarioId: userId, publicacionId } });
        if (existing) {
            await this.meGustaRepo.remove(existing);
        } else {
            await this.meGustaRepo.save(this.meGustaRepo.create({ usuarioId: userId, publicacionId }));
        }
        const count = await this.meGustaRepo.count({ where: { publicacionId } });
        return { liked: !existing, count };
    }

    async getLike(publicacionId: number, userId?: number): Promise<{ count: number; userLiked: boolean }> {
        const count = await this.meGustaRepo.count({ where: { publicacionId } });
        const userLiked = userId
            ? !!(await this.meGustaRepo.findOne({ where: { usuarioId: userId, publicacionId } }))
            : false;
        return { count, userLiked };
    }

    // ── Comentarios ──────────────────────────────────────────────────────────

    getComentarios(publicacionId: number): Promise<Comentario[]> {
        return this.comentarioRepo.find({
            where: { publicacionId },
            order: { createdAt: 'ASC' },
        });
    }

    async crearComentario(userId: number, publicacionId: number, contenido: string): Promise<Comentario> {
        const comentario = this.comentarioRepo.create({ usuarioId: userId, publicacionId, contenido });
        return this.comentarioRepo.save(comentario);
    }

    async eliminarComentario(id: number, usuario: Usuario): Promise<void> {
        const comentario = await this.comentarioRepo.findOne({ where: { id } });
        if (!comentario) throw new NotFoundException('Comentario no encontrado');
        if (usuario.rol !== RolUsuario.ADMIN && comentario.usuarioId !== usuario.id) {
            throw new ForbiddenException('No puedes eliminar este comentario');
        }
        await this.comentarioRepo.remove(comentario);
    }
}
