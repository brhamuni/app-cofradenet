import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
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

    /**
     * @brief Lista todos los usuarios aplicando filtros opcionales de rol, verificación
     *        y estado de bloqueo, devolviendo solo los campos necesarios para el panel admin.
     *
     * @details
     * Construye un QueryBuilder con proyección explícita (`select`) para evitar
     * devolver campos sensibles (p.ej. `passwordHash`). Los filtros son opcionales e
     * independientes: si todos son `undefined` se devuelven todos los usuarios.
     *
     * Conversión de tipos: los parámetros llegan como `string` desde los query params
     * HTTP (`'true'` / `'false'`); la comparación `=== 'true'` los convierte a `boolean`
     * antes de pasarlos al parámetro SQL para que TypeORM genere `WHERE u.verificado = $1`
     * con el tipo correcto en PostgreSQL.
     *
     * @pre   El llamador debe ser ADMIN (verificado en el controlador con `@Roles(ADMIN)`).
     * @post  Ningún campo sensible (contraseña, tokens) se incluye en el resultado.
     *
     * @param {{ rol?: string; verificado?: string; bloqueado?: string }} filters
     *   - `rol`        Filtra por rol exacto: `'admin'|'cofrade'|'hermandad'|'banda'`.
     *   - `verificado` Filtra por estado de verificación: `'true'` o `'false'`.
     *   - `bloqueado`  Filtra por estado de bloqueo: `'true'` o `'false'`.
     * @returns {Promise<Usuario[]>} Usuarios filtrados con proyección parcial y ciudad de residencia.
     *
     * @note Si se añaden nuevos campos a `Usuario` que deban aparecer en el panel admin,
     *       hay que incluirlos explícitamente en el array de `select`. Sin ese `select`
     *       TypeORM devuelve todos los campos por defecto, incluyendo la contraseña hasheada.
     *
     * @see AdminController.findAllUsers
     * @see getCiudadesConContadores
     */
    async findAllUsers(filters: { rol?: string; verificado?: string; bloqueado?: string }) {
        const query = this.usuariosRepo
            .createQueryBuilder('u')
            .leftJoin('u.ciudadResidencia', 'ciudad')
            .leftJoin('u.hermandad', 'hermandad')
            .leftJoin('u.banda', 'banda')
            .select([
                'u.id', 'u.nombre', 'u.username', 'u.email',
                'u.rol', 'u.verificado', 'u.estaBloqueado',
                'ciudad.id', 'ciudad.nombre',
                'hermandad.id',
                'banda.id',
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

    async editarUsuario(id: number, dto: { nombre?: string; username?: string; email?: string; rol?: RolUsuario; password?: string }) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        const updates: Partial<Usuario> = {};
        if (dto.nombre !== undefined) updates.nombre = dto.nombre;
        if (dto.username !== undefined) updates.username = dto.username;
        if (dto.email !== undefined) updates.email = dto.email;
        if (dto.rol !== undefined) updates.rol = dto.rol;
        if (dto.password) updates.password = await bcrypt.hash(dto.password, 10);

        await this.usuariosRepo.update(id, updates);
        return this.usuariosRepo.findOne({ where: { id }, relations: ['ciudadResidencia'] });
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

    /**
     * @brief Devuelve todas las ciudades enriquecidas con el número de hermandades
     *        y bandas que tienen asociadas, para mostrar contadores en el panel admin.
     *
     * @details
     * El método aplica un patrón N+1 controlado:
     * 1. Carga todas las ciudades ordenadas alfabéticamente (1 consulta).
     * 2. Por cada ciudad lanza dos `COUNT` en paralelo (`Promise.all` interno de cada `map`).
     *
     * El `Promise.all` externo agrupa el array de promesas para esperar a todos antes
     * de resolver, evitando una cascada secuencial. Para plataformas con cientos de
     * ciudades esto puede generar muchas conexiones simultáneas; en ese escenario
     * se recomienda migrar a una subquery o GROUP BY en SQL.
     *
     * @pre   Las entidades `Hermandad` y `Banda` deben tener la columna `ciudadId`
     *        (FK a `ciudades.id`) correctamente indexada para que los COUNT sean eficientes.
     * @post  El array resultado preserva el orden alfabético de las ciudades.
     *
     * @returns {Promise<Array<Ciudad & { numHermandades: number; numBandas: number }>>}
     *   Ciudades con dos campos adicionales: `numHermandades` y `numBandas`.
     *
     * @complexity O(c) consultas de COUNT, donde c es el número de ciudades.
     *             Con índices sobre `ciudadId`, cada COUNT es O(1) por coste de índice.
     *
     * @warning Patrón N+1: genera `2 * numCiudades` consultas adicionales. Aceptable
     *          mientras el catálogo de ciudades sea pequeño (<100). Para escalar,
     *          reemplazar con `LEFT JOIN ... COUNT(*) GROUP BY ciudad.id`.
     *
     * @see AdminController.getCiudades
     * @see findAllUsers
     */
    async getCiudadesConContadores(page: number = 1, limit: number = 25, buscar?: string) {
        const skip = (page - 1) * limit;

        const qb = this.ciudadesRepo
            .createQueryBuilder('c')
            .orderBy('c.nombre', 'ASC')
            .skip(skip)
            .take(limit);

        if (buscar) {
            qb.where('unaccent(c.nombre) ILIKE unaccent(:buscar)', { buscar: `%${buscar}%` });
        }

        const [ciudades, total] = await qb.getManyAndCount();

        const data = await Promise.all(
            ciudades.map(async (c) => ({
                ...c,
                numHermandades: await this.hermandadesRepo.count({ where: { ciudadId: c.id } }),
                numBandas: await this.bandasRepo.count({ where: { ciudadId: c.id } }),
            })),
        );
        return { data, total, page, totalPages: Math.ceil(total / limit), limit };
    }
}
