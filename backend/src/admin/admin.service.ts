import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Publicacion } from '@backend/publicaciones/entities/publicacion.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
        @InjectRepository(Hermandad)
        private readonly hermandadesRepo: Repository<Hermandad>,
        @InjectRepository(Banda)
        private readonly bandasRepo: Repository<Banda>,
        @InjectRepository(Ciudad)
        private readonly ciudadesRepo: Repository<Ciudad>,
        @InjectRepository(Publicacion)
        private readonly publicacionesRepo: Repository<Publicacion>,
    ) {}

    // --- Usuarios ---

    async findAllUsers(filters: { rol?: string; verificado?: string; bloqueado?: string }) {
        const query = this.usuariosRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.ciudadResidencia', 'ciudad')
            .select([
                'u.id', 'u.nombre', 'u.username', 'u.email',
                'u.rol', 'u.verificado', 'u.estaBloqueado',
                'ciudad.id', 'ciudad.nombre',
            ]);

        if (filters.rol) {
            query.andWhere('u.rol = :rol', { rol: filters.rol });
        }
        if (filters.verificado !== undefined) {
            query.andWhere('u.verificado = :verificado', { verificado: filters.verificado === 'true' });
        }
        if (filters.bloqueado !== undefined) {
            query.andWhere('u.estaBloqueado = :bloqueado', { bloqueado: filters.bloqueado === 'true' });
        }

        return query.getMany();
    }

    async findUser(id: number) {
        const usuario = await this.usuariosRepo.findOne({
            where: { id },
            relations: ['ciudadResidencia'],
        });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        return usuario;
    }

    async verificarUsuario(id: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.verificado = true;
        await this.usuariosRepo.save(usuario);
        return { message: 'Usuario verificado', id: usuario.id, verificado: true };
    }

    async bloquearUsuario(id: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.estaBloqueado = true;
        await this.usuariosRepo.save(usuario);
        return { message: 'Usuario bloqueado', id: usuario.id, estaBloqueado: true };
    }

    async desbloquearUsuario(id: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.estaBloqueado = false;
        await this.usuariosRepo.save(usuario);
        return { message: 'Usuario desbloqueado', id: usuario.id, estaBloqueado: false };
    }

    async cambiarRol(id: number, rol: RolUsuario) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.rol = rol;
        await this.usuariosRepo.save(usuario);
        return { message: 'Rol actualizado', id: usuario.id, rol: usuario.rol };
    }

    async eliminarUsuario(id: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        await this.usuariosRepo.remove(usuario);
        return { message: 'Usuario eliminado' };
    }

    // --- Hermandades ---

    async findAllHermandades() {
        return this.hermandadesRepo.find({ relations: ['ciudad', 'usuario'] });
    }

    async verificarHermandad(id: number) {
        const hermandad = await this.hermandadesRepo.findOneBy({ id });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');
        hermandad.verificada = true;
        await this.hermandadesRepo.save(hermandad);
        return { message: 'Hermandad verificada', id: hermandad.id, verificada: true };
    }

    async editarHermandad(id: number, dto: any) {
        const hermandad = await this.hermandadesRepo.findOneBy({ id });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');
        Object.assign(hermandad, dto);
        return this.hermandadesRepo.save(hermandad);
    }

    async eliminarHermandad(id: number) {
        const hermandad = await this.hermandadesRepo.findOneBy({ id });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');
        await this.hermandadesRepo.remove(hermandad);
        return { message: 'Hermandad eliminada' };
    }

    // --- Bandas ---

    async findAllBandas() {
        return this.bandasRepo.find({ relations: ['ciudad', 'usuario'] });
    }

    async verificarBanda(id: number) {
        const banda = await this.bandasRepo.findOneBy({ id });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        banda.verificada = true;
        await this.bandasRepo.save(banda);
        return { message: 'Banda verificada', id: banda.id, verificada: true };
    }

    // --- Publicaciones ---

    async eliminarPublicacion(id: number) {
        const pub = await this.publicacionesRepo.findOneBy({ id });
        if (!pub) throw new NotFoundException('Publicación no encontrada');
        await this.publicacionesRepo.remove(pub);
        return { message: 'Publicación eliminada' };
    }

    // --- Estadísticas ---

    async getEstadisticas() {
        const [totalUsuarios, hermandadesVerificadas, bandasVerificadas, totalCiudades] =
            await Promise.all([
                this.usuariosRepo.count(),
                this.hermandadesRepo.count({ where: { verificada: true } }),
                this.bandasRepo.count({ where: { verificada: true } }),
                this.ciudadesRepo.count(),
            ]);
        return { totalUsuarios, hermandadesVerificadas, bandasVerificadas, totalCiudades };
    }

    // --- Ciudades con contadores ---

    async getCiudadesConContadores() {
        const ciudades = await this.ciudadesRepo.find({ order: { nombre: 'ASC' } });
        return Promise.all(
            ciudades.map(async (c) => ({
                ...c,
                numHermandades: await this.hermandadesRepo.count({ where: { ciudadId: c.id } }),
                numBandas: await this.bandasRepo.count({ where: { ciudadId: c.id } }),
            })),
        );
    }
}
