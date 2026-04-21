import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publicacion } from './entities/publicacion.entity';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { Usuario, RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Injectable()
export class PublicacionesService {
    constructor(
        @InjectRepository(Publicacion)
        private readonly repo: Repository<Publicacion>,
    ) {}

    async create(dto: CreatePublicacionDto, autor: Usuario): Promise<Publicacion> {
        const publicacion = this.repo.create({
            ...dto,
            autorId: autor.id,
        });
        return this.repo.save(publicacion);
    }

    findByHermandad(hermandadId: number): Promise<Publicacion[]> {
        return this.repo.find({
            where: { hermandadId },
            order: { fechaCreacion: 'DESC' },
        });
    }

    findByBanda(bandaId: number): Promise<Publicacion[]> {
        return this.repo.find({
            where: { bandaId },
            order: { fechaCreacion: 'DESC' },
        });
    }

    findByUsuario(autorId: number): Promise<Publicacion[]> {
        return this.repo.find({
            where: { autorId, hermandadId: null as any, bandaId: null as any },
            order: { fechaCreacion: 'DESC' },
        });
    }

    async remove(id: number, usuario: Usuario): Promise<void> {
        const pub = await this.repo.findOne({ where: { id } });
        if (!pub) throw new NotFoundException('Publicación no encontrada');

        const esAdmin = usuario.rol === RolUsuario.ADMIN;
        const esAutor = pub.autorId === usuario.id;
        if (!esAdmin && !esAutor) throw new ForbiddenException('No puedes eliminar esta publicación');

        await this.repo.remove(pub);
    }
}
