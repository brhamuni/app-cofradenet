/**
 * @file publicaciones.service.ts
 * @brief Servicio de gestión de publicaciones, me gustas y comentarios de CofradeNet.
 * @details Gestiona el feed social de la plataforma: creación de publicaciones,
 *          feed personalizado basado en seguimientos, feed general, interacciones
 *          (me gusta con toggle) y comentarios con control de permisos.
 */

import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
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

    /**
     * @brief Crea una nueva publicación asociada al autor autenticado.
     *
     * @param {CreatePublicacionDto} dto - DTO con el contenido y opcionales `hermandadId`/`bandaId`.
     * @param {Usuario} autor           - Entidad del usuario autor de la publicación.
     * @returns {Promise<Publicacion>} Publicación recién creada.
     */
    async create(
        dto: CreatePublicacionDto,
        autor: Usuario,
    ): Promise<Publicacion> {
        const publicacion = this.repo.create({ ...dto, autorId: autor.id });
        return this.repo.save(publicacion);
    }

    /**
     * @brief Construye un QueryBuilder base con las relaciones y contadores comunes a todas las consultas.
     *
     * @details
     * Centraliza la definición del grafo de relaciones y los contadores virtuales para
     * evitar duplicación. Carga las relaciones `autor`, `hermandad` y `banda`, y añade
     * contadores mapeados como propiedades virtuales: `likesCount` y `comentariosCount`.
     * Todos los métodos de consulta pública deben construirse sobre este método.
     *
     * @param {string} [alias='p'] - Alias de la entidad raíz en el QueryBuilder.
     * @returns {SelectQueryBuilder<Publicacion>} QueryBuilder preconfigurado con relaciones y contadores.
     */
    private buildQuery(alias = 'p') {
        return this.repo
            .createQueryBuilder(alias)
            .leftJoinAndSelect(`${alias}.autor`, 'autor')
            .leftJoinAndSelect(`${alias}.hermandad`, 'hermandad')
            .leftJoinAndSelect(`${alias}.banda`, 'banda')
            .loadRelationCountAndMap(`${alias}.likesCount`, `${alias}.meGustas`)
            .loadRelationCountAndMap(
                `${alias}.comentariosCount`,
                `${alias}.comentarios`,
            );
    }

    /**
     * @brief Obtiene las publicaciones de una hermandad ordenadas por fecha descendente.
     *
     * @param {number} hermandadId - Identificador de la hermandad.
     * @returns {Promise<any[]>} Publicaciones de la hermandad con contadores de likes y comentarios.
     */
    findByHermandad(hermandadId: number): Promise<any[]> {
        return this.buildQuery()
            .where('p.hermandadId = :id', { id: hermandadId })
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    /**
     * @brief Obtiene las publicaciones de una banda ordenadas por fecha descendente.
     *
     * @param {number} bandaId - Identificador de la banda.
     * @returns {Promise<any[]>} Publicaciones de la banda con contadores de likes y comentarios.
     */
    findByBanda(bandaId: number): Promise<any[]> {
        return this.buildQuery()
            .where('p.bandaId = :id', { id: bandaId })
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    /**
     * @brief Obtiene las publicaciones personales de un usuario (sin hermandad ni banda asociada).
     *
     * @details
     * Filtra publicaciones donde `autorId` coincide y tanto `hermandadId` como `bandaId`
     * son nulos, de modo que solo se devuelven las publicaciones propias del usuario,
     * no las que haya publicado en nombre de una entidad.
     *
     * @param {number} autorId - Identificador del usuario autor.
     * @returns {Promise<any[]>} Publicaciones personales del usuario con contadores.
     */
    findByUsuario(autorId: number): Promise<any[]> {
        return this.buildQuery()
            .where(
                'p.autorId = :id AND p.hermandadId IS NULL AND p.bandaId IS NULL',
                { id: autorId },
            )
            .orderBy('p.fechaCreacion', 'DESC')
            .getMany();
    }

    /**
     * @brief Obtiene el feed personalizado paginado basado en los seguimientos del usuario.
     *
     * @details
     * El feed se construye en cuatro fases:
     * 1. Recupera todos los seguimientos del usuario para extraer `hermandadIds` y `bandaIds`.
     * 2. Si no hay ningún seguimiento, devuelve resultado vacío sin consultar publicaciones.
     * 3. Construye un QueryBuilder dinámico con condiciones OR para hermandades y/o bandas
     *    seguidas, aplicando paginación (`skip`/`take`) y orden descendente.
     * 4. Enriquece cada publicación con el campo virtual `userLiked` consultando la tabla
     *    `me_gustas` con el operador `In` sobre los IDs de las publicaciones obtenidas.
     *
     * @pre   El usuario debe existir y tener seguimientos para recibir contenido en el feed.
     * @post  Las publicaciones devueltas incluyen `userLiked` indicando si el usuario las ha marcado.
     *
     * @param {number} userId   - Identificador del usuario autenticado.
     * @param {number} [page=1] - Número de página (base 1).
     * @param {number} [limit=20] - Número de publicaciones por página.
     * @returns {Promise<{ publicaciones: any[]; total: number; page: number; limit: number }>}
     *          Resultado paginado con publicaciones enriquecidas y metadatos de paginación.
     *
     * @complexity O(s + p + l) donde s = seguimientos del usuario, p = publicaciones de la página,
     *             l = likes del usuario sobre esas publicaciones.
     */
    async getFeed(
        userId: number,
        page = 1,
        limit = 20,
    ): Promise<{
        publicaciones: any[];
        total: number;
        page: number;
        limit: number;
    }> {
        const seguimientos = await this.seguimientoRepo.find({
            where: { seguidorId: userId },
        });

        const hermandadIds = seguimientos
            .filter((s) => s.hermandadId)
            .map((s) => s.hermandadId);
        const bandaIds = seguimientos
            .filter((s) => s.bandaId)
            .map((s) => s.bandaId);

        if (hermandadIds.length === 0 && bandaIds.length === 0) {
            return { publicaciones: [], total: 0, page, limit };
        }

        const qb = this.buildQuery();
        const conditions: string[] = [];
        if (hermandadIds.length)
            conditions.push('p.hermandadId IN (:...hermandadIds)');
        if (bandaIds.length) conditions.push('p.bandaId IN (:...bandaIds)');

        qb.where(`(${conditions.join(' OR ')})`, {
            ...(hermandadIds.length ? { hermandadIds } : {}),
            ...(bandaIds.length ? { bandaIds } : {}),
        })
            .orderBy('p.fechaCreacion', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [publicaciones, total] = await qb.getManyAndCount();

        const publicacionIds = publicaciones.map((p) => (p as any).id);
        const likes = publicacionIds.length
            ? await this.meGustaRepo.find({
                  where: {
                      usuarioId: userId,
                      publicacionId: In(publicacionIds),
                  },
              })
            : [];
        const likedSet = new Set(likes.map((l) => l.publicacionId));
        const enriched = publicaciones.map((p) => ({
            ...(p as any),
            userLiked: likedSet.has((p as any).id),
        }));

        return { publicaciones: enriched, total, page, limit };
    }

    /**
     * @brief Obtiene el feed general paginado de todas las publicaciones de la plataforma.
     *
     * @details
     * Devuelve todas las publicaciones ordenadas por fecha descendente con paginación.
     * Si se proporciona `userId`, enriquece el resultado con el campo `userLiked`
     * de manera análoga a `getFeed`. Si no se proporciona, devuelve los datos sin enriquecer
     * (compatible con acceso anónimo o sin autenticación).
     *
     * @param {number | undefined} userId - Identificador del usuario (opcional para visitantes).
     * @param {number} [page=1]           - Número de página (base 1).
     * @param {number} [limit=20]         - Número de publicaciones por página.
     * @returns {Promise<{ publicaciones: any[]; total: number; page: number; limit: number }>}
     *          Resultado paginado con publicaciones y metadatos de paginación.
     */
    async getGeneral(
        userId: number | undefined,
        page = 1,
        limit = 20,
    ): Promise<{
        publicaciones: any[];
        total: number;
        page: number;
        limit: number;
    }> {
        const qb = this.buildQuery()
            .orderBy('p.fechaCreacion', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [publicaciones, total] = await qb.getManyAndCount();

        if (userId) {
            const publicacionIds = publicaciones.map((p) => (p as any).id);
            const likes = publicacionIds.length
                ? await this.meGustaRepo.find({
                      where: {
                          usuarioId: userId,
                          publicacionId: In(publicacionIds),
                      },
                  })
                : [];
            const likedSet = new Set(likes.map((l) => l.publicacionId));
            const enriched = publicaciones.map((p) => ({
                ...(p as any),
                userLiked: likedSet.has((p as any).id),
            }));
            return { publicaciones: enriched, total, page, limit };
        }

        return { publicaciones, total, page, limit };
    }

    /**
     * @brief Elimina una publicación con verificación de autoría o rol administrador.
     *
     * @param {number} id        - Identificador de la publicación a eliminar.
     * @param {Usuario} usuario  - Usuario autenticado que solicita la eliminación.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException}  Si la publicación no existe.
     * @throws {ForbiddenException} Si el usuario no es el autor ni administrador.
     */
    async remove(id: number, usuario: Usuario): Promise<void> {
        const pub = await this.repo.findOne({ where: { id } });
        if (!pub) throw new NotFoundException('Publicación no encontrada');
        if (usuario.rol !== RolUsuario.ADMIN && pub.autorId !== usuario.id) {
            throw new ForbiddenException('No puedes eliminar esta publicación');
        }
        await this.repo.remove(pub);
    }

    /**
     * @brief Alterna el estado de "me gusta" de un usuario sobre una publicación.
     *
     * @details
     * Si ya existe un registro `MeGusta` para el par `(usuarioId, publicacionId)`,
     * lo elimina (unlike). Si no existe, lo crea (like). En ambos casos devuelve
     * el conteo total actual de likes y el nuevo estado `liked`.
     *
     * @param {number} userId         - Identificador del usuario que interactúa.
     * @param {number} publicacionId  - Identificador de la publicación.
     * @returns {Promise<{ liked: boolean; count: number }>} Estado final del like y total de likes.
     */
    async toggleLike(
        userId: number,
        publicacionId: number,
    ): Promise<{ liked: boolean; count: number }> {
        const existing = await this.meGustaRepo.findOne({
            where: { usuarioId: userId, publicacionId },
        });
        if (existing) {
            await this.meGustaRepo.remove(existing);
        } else {
            await this.meGustaRepo.save(
                this.meGustaRepo.create({ usuarioId: userId, publicacionId }),
            );
        }
        const count = await this.meGustaRepo.count({
            where: { publicacionId },
        });
        return { liked: !existing, count };
    }

    /**
     * @brief Obtiene el recuento de likes de una publicación y si el usuario la ha marcado.
     *
     * @param {number} publicacionId - Identificador de la publicación.
     * @param {number} [userId]      - Identificador del usuario (opcional).
     * @returns {Promise<{ count: number; userLiked: boolean }>}
     *          Total de likes y si el usuario indicado ha dado like.
     */
    async getLike(
        publicacionId: number,
        userId?: number,
    ): Promise<{ count: number; userLiked: boolean }> {
        const count = await this.meGustaRepo.count({
            where: { publicacionId },
        });
        const userLiked = userId
            ? !!(await this.meGustaRepo.findOne({
                  where: { usuarioId: userId, publicacionId },
              }))
            : false;
        return { count, userLiked };
    }

    /**
     * @brief Obtiene todos los comentarios de una publicación ordenados cronológicamente.
     *
     * @param {number} publicacionId - Identificador de la publicación.
     * @returns {Promise<Comentario[]>} Comentarios ordenados por `createdAt` ascendente.
     */
    getComentarios(publicacionId: number): Promise<Comentario[]> {
        return this.comentarioRepo.find({
            where: { publicacionId },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * @brief Crea un nuevo comentario en una publicación.
     *
     * @param {number} userId         - Identificador del usuario autor del comentario.
     * @param {number} publicacionId  - Identificador de la publicación comentada.
     * @param {string} contenido      - Texto del comentario.
     * @returns {Promise<Comentario>} Comentario recién creado.
     */
    async crearComentario(
        userId: number,
        publicacionId: number,
        contenido: string,
    ): Promise<Comentario> {
        const comentario = this.comentarioRepo.create({
            usuarioId: userId,
            publicacionId,
            contenido,
        });
        return this.comentarioRepo.save(comentario);
    }

    /**
     * @brief Elimina un comentario con verificación de autoría o rol administrador.
     *
     * @param {number} id        - Identificador del comentario a eliminar.
     * @param {Usuario} usuario  - Usuario autenticado que solicita la eliminación.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException}  Si el comentario no existe.
     * @throws {ForbiddenException} Si el usuario no es el autor del comentario ni administrador.
     */
    async eliminarComentario(id: number, usuario: Usuario): Promise<void> {
        const comentario = await this.comentarioRepo.findOne({ where: { id } });
        if (!comentario)
            throw new NotFoundException('Comentario no encontrado');
        if (
            usuario.rol !== RolUsuario.ADMIN &&
            comentario.usuarioId !== usuario.id
        ) {
            throw new ForbiddenException('No puedes eliminar este comentario');
        }
        await this.comentarioRepo.remove(comentario);
    }
}
