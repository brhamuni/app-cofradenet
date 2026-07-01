/**
 * @file usuarios.service.ts
 * @brief Servicio de gestión de usuarios de CofradeNet.
 * @details Cubre el registro de nuevos usuarios con creación automática de
 *          entidades asociadas (hermandad o banda), gestión de favoritos,
 *          consulta de perfiles y administración de roles y bloqueos.
 */

import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { RolUsuario, Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
        @InjectRepository(Hermandad)
        private readonly hermandadesRepo: Repository<Hermandad>,
        @InjectRepository(Banda)
        private readonly bandasRepo: Repository<Banda>,
        @InjectRepository(Ciudad)
        private readonly ciudadesRepo: Repository<Ciudad>,
    ) {}

    /**
     * @brief Registra un nuevo usuario y crea automáticamente su entidad asociada según el rol.
     *
     * @details
     * El flujo de creación sigue este orden:
     * 1. Valida unicidad de `email` y `username` contra la base de datos, lanzando
     *    `BadRequestException` ante cualquier colisión.
     * 2. Resuelve la ciudad por nombre con búsqueda insensible a mayúsculas/minúsculas
     *    (`LOWER(c.nombre) = LOWER(:nombre)`), permitiendo que el cliente envíe
     *    "sevilla", "Sevilla" o "SEVILLA" indistintamente.
     * 3. Genera salt con factor de coste 10 y hashea la contraseña con `bcrypt`.
     * 4. Persiste el usuario y, según su `rol`:
     *    - `HERMANDAD`: crea un registro en `Hermandad` vinculado al usuario, usando
     *      valores por defecto para `templo` y `diaSalida` si no se proporcionan.
     *    - `BANDA`: crea un registro en `Banda` con los datos musicales del DTO.
     *
     * @pre   El email y el username no deben existir previamente en la base de datos.
     * @post  Existe al menos un registro en `usuarios` y, si aplica, uno en `hermandades`
     *        o `bandas` con `usuarioId` apuntando al nuevo usuario.
     *
     * @param {CreateUsuarioDto} createUsuarioDto - Datos del nuevo usuario incluyendo
     *        credenciales, rol y campos opcionales de hermandad/banda.
     * @returns {Promise<Usuario>} Entidad del usuario recién creado (sin contraseña).
     *
     * @throws {BadRequestException} Si el email o el username ya están en uso.
     *
     * @complexity O(1) en consultas indexadas; el hash bcrypt es O(2^cost) donde cost=10.
     */
    async create(createUsuarioDto: CreateUsuarioDto) {
        console.log('Creando usuario:', createUsuarioDto);
        const { password, ciudad, ...datosUsuario } = createUsuarioDto;

        const existeEmail = await this.usuariosRepo.findOneBy({
            email: createUsuarioDto.email,
        });

        if (existeEmail) {
            throw new BadRequestException('El email ya está en uso');
        }

        const existeUsername = await this.usuariosRepo.findOneBy({
            username: datosUsuario.username,
        });

        if (existeUsername) {
            throw new BadRequestException('El username ya está en uso');
        }

        // Buscamos la ciudad por nombre (insensible a mayúsculas)
        let ciudadEntidad: Ciudad | null = null;
        if (ciudad) {
            ciudadEntidad = await this.ciudadesRepo
                .createQueryBuilder('c')
                .where('LOWER(c.nombre) = LOWER(:nombre)', {
                    nombre: ciudad.trim(),
                })
                .getOne();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = this.usuariosRepo.create({
            ...datosUsuario,
            password: hashedPassword,
            ...(ciudadEntidad && { ciudadResidencia: ciudadEntidad }),
        });

        const usuarioGuardado = await this.usuariosRepo.save(nuevoUsuario);

        if (usuarioGuardado.rol === RolUsuario.HERMANDAD) {
            const nuevaHermandad = this.hermandadesRepo.create({
                nombre: `Hermandad ${usuarioGuardado.nombre}`,
                templo: createUsuarioDto.templo || 'Templo por definir',
                diaSalida: createUsuarioDto.diaSalida || 'Día por definir',
                usuarioId: usuarioGuardado.id,
                ...(ciudadEntidad && {
                    ciudadId: ciudadEntidad.id,
                }),
            });
            await this.hermandadesRepo.save(nuevaHermandad);
        }

        if (usuarioGuardado.rol === RolUsuario.BANDA) {
            const nuevaBanda = this.bandasRepo.create({
                nombre: createUsuarioDto.nombre,
                estiloMusical:
                    createUsuarioDto.estiloMusical || 'No especificado',
                localidad: createUsuarioDto.localidad || 'No especificada',
                direccion: createUsuarioDto.direccion || 'No especificada',
                usuarioId: usuarioGuardado.id,
            });
            await this.bandasRepo.save(nuevaBanda);
        }

        return usuarioGuardado;
    }

    /**
     * @brief Alterna el estado de favorito de una hermandad para un usuario dado.
     *
     * @details
     * Implementa un toggle idempotente sobre la relación many-to-many
     * `usuario ↔ hermandadesFavoritas`:
     * - Si la hermandad YA está en la lista → se elimina del array y se guarda.
     * - Si la hermandad NO está en la lista → se añade al array y se guarda.
     *
     * La búsqueda dentro del array se realiza por `id` con `Array.findIndex`,
     * de modo que el índice devuelto determina tanto la operación a ejecutar como
     * el mensaje de respuesta (`index >= 0` → eliminar, `index < 0` → añadir).
     *
     * @pre   El usuario y la hermandad deben existir en base de datos.
     * @post  La tabla intermedia `usuario_hermandades_favoritas` refleja el nuevo estado.
     *
     * @param {number} userId       - Identificador del usuario autenticado.
     * @param {number} hermandadId  - Identificador de la hermandad a marcar/desmarcar.
     * @returns {Promise<object>} Objeto con `message` descriptivo y `favorito` booleano
     *          indicando el estado final (true = ahora es favorita).
     *
     * @throws {NotFoundException} Si el usuario o la hermandad no existen.
     */
    async toggleFavoritoHermandad(userId: number, hermandadId: number) {
        const usuario = await this.usuariosRepo.findOne({
            where: { id: userId },
            relations: ['hermandadesFavoritas'],
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const hermandad = await this.hermandadesRepo.findOneBy({
            id: hermandadId,
        });
        if (!hermandad) throw new NotFoundException('Hermandad no encontrada');

        const index = usuario.hermandadesFavoritas.findIndex(
            (h) => h.id === hermandadId,
        );

        if (index >= 0) {
            // Si ya está, la quitamos
            usuario.hermandadesFavoritas.splice(index, 1);
        } else {
            // Si no está, la añadimos
            usuario.hermandadesFavoritas.push(hermandad);
        }

        await this.usuariosRepo.save(usuario);
        return {
            message:
                index >= 0 ? 'Eliminada de favoritos' : 'Añadida a favoritos',
            favorito: index < 0,
        };
    }

    /**
     * @brief Alterna el estado de favorito de una banda para un usuario dado.
     *
     * @details
     * Implementa un toggle idempotente sobre la relación many-to-many
     * `usuario ↔ bandasFavoritas`. El array se inicializa a `[]` si la entidad
     * lo devuelve como `undefined` (puede ocurrir si el usuario nunca tuvo favoritos
     * y la relación no está cargada con valor por defecto).
     *
     * La lógica de alternancia es idéntica a `toggleFavoritoHermandad`:
     * `findIndex` determina la operación; `splice` elimina o `push` añade.
     *
     * @pre   El usuario y la banda deben existir en base de datos.
     * @post  La tabla intermedia `usuario_bandas_favoritas` refleja el nuevo estado.
     *
     * @param {number} userId  - Identificador del usuario autenticado.
     * @param {number} bandaId - Identificador de la banda a marcar/desmarcar.
     * @returns {Promise<object>} Objeto con `message` descriptivo y `favorito` booleano
     *          indicando el estado final (true = ahora es favorita).
     *
     * @throws {NotFoundException} Si el usuario o la banda no existen.
     */
    async toggleFavoritoBanda(userId: number, bandaId: number) {
        const usuario = await this.usuariosRepo.findOne({
            where: { id: userId },
            relations: ['bandasFavoritas'],
        });

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        const banda = await this.bandasRepo.findOne({
            where: { id: bandaId },
        });

        if (!banda) throw new NotFoundException('Banda no encontrada');

        if (!usuario.bandasFavoritas) usuario.bandasFavoritas = [];

        const index = usuario.bandasFavoritas.findIndex(
            (b) => b.id === bandaId,
        );

        if (index >= 0) {
            usuario.bandasFavoritas.splice(index, 1);
        } else {
            usuario.bandasFavoritas.push(banda);
        }

        await this.usuariosRepo.save(usuario);

        return {
            message:
                index >= 0
                    ? 'Banda eliminada de favoritos'
                    : 'Banda añadida a favoritos',
            favorito: index < 0,
        };
    }

    /**
     * @brief Obtiene la lista completa de usuarios con campos básicos.
     *
     * @returns {Promise<Usuario[]>} Array de usuarios con `id`, `nombre`, `email` y `rol`.
     */
    async findAll() {
        return await this.usuariosRepo.find({
            select: ['id', 'nombre', 'email', 'rol'],
        });
    }

    /**
     * @brief Recupera el perfil completo de un usuario con sus relaciones de favoritos y ciudad.
     *
     * @details
     * Carga las relaciones `hermandadesFavoritas`, `bandasFavoritas` y `ciudadResidencia`
     * en una sola consulta. Solo expone `id`, `username` y `rol` de la entidad raíz
     * para evitar filtrar datos sensibles como el email o el hash de contraseña.
     *
     * @param {number} userId - Identificador del usuario autenticado.
     * @returns {Promise<Usuario | null>} Perfil del usuario con relaciones, o `null` si no existe.
     */
    async getPerfil(userId: number) {
        return await this.usuariosRepo.findOne({
            where: { id: userId },
            relations: [
                'hermandadesFavoritas',
                'bandasFavoritas',
                'ciudadResidencia',
            ],
            select: ['id', 'username', 'nombre', 'rol', 'avatar', 'banner'],
        });
    }

    /**
     * @brief Actualiza el banner del usuario autenticado.
     */
    async updateBanner(userId: number, rutaImagen: string) {
        const usuario = await this.usuariosRepo.findOneBy({ id: userId });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.banner = rutaImagen;
        return await this.usuariosRepo.save(usuario);
    }

    /**
     * @brief Actualiza nombre, username y/o contraseña del perfil del usuario autenticado.
     */
    async updatePerfil(userId: number, dto: UpdatePerfilDto) {
        const usuario = await this.usuariosRepo
            .createQueryBuilder('usuario')
            .addSelect('usuario.password')
            .where('usuario.id = :id', { id: userId })
            .getOne();

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        if (dto.nombre?.trim()) {
            usuario.nombre = dto.nombre.trim();
        }

        if (dto.username?.trim()) {
            const nuevoUsername = dto.username.trim();
            if (nuevoUsername !== usuario.username) {
                const existe = await this.usuariosRepo.findOneBy({
                    username: nuevoUsername,
                });
                if (existe && existe.id !== userId) {
                    throw new BadRequestException('El username ya está en uso');
                }
                usuario.username = nuevoUsername;
            }
        }

        if (dto.passwordNueva) {
            if (!dto.passwordActual) {
                throw new BadRequestException('Indica la contraseña actual');
            }
            const valida = await bcrypt.compare(
                dto.passwordActual,
                usuario.password,
            );
            if (!valida) {
                throw new UnauthorizedException('La contraseña actual no es correcta');
            }
            const salt = await bcrypt.genSalt();
            usuario.password = await bcrypt.hash(dto.passwordNueva, salt);
        }

        await this.usuariosRepo.save(usuario);
        return this.getPerfil(userId);
    }

    /**
     * @brief Actualiza el avatar del usuario autenticado.
     */
    async updateAvatar(userId: number, rutaImagen: string) {
        const usuario = await this.usuariosRepo.findOneBy({ id: userId });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.avatar = rutaImagen;
        return await this.usuariosRepo.save(usuario);
    }

    /**
     * @brief Elimina el avatar del usuario autenticado.
     */
    async removeAvatar(userId: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id: userId });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.avatar = null;
        await this.usuariosRepo.save(usuario);
        return this.getPerfil(userId);
    }

    /**
     * @brief Busca un usuario por su identificador primario.
     *
     * @param {number} id - Identificador del usuario.
     * @returns {Promise<Usuario | null>} Entidad del usuario o `null` si no existe.
     */
    async findOne(id: number) {
        return await this.usuariosRepo.findOneBy({ id });
    }

    /**
     * @brief Actualiza los datos de un usuario (pendiente de implementación).
     *
     * @param {number} id - Identificador del usuario a actualizar.
     * @param {UpdateUsuarioDto} _updateUsuarioDto - DTO con los campos a actualizar.
     * @returns {string} Mensaje provisional indicando la acción pendiente.
     */
    update(id: number, _updateUsuarioDto: UpdateUsuarioDto) {
        return `This action updates a #${id} usuario`;
    }

    /**
     * @brief Elimina un usuario de la base de datos por su identificador.
     *
     * @param {number} id - Identificador del usuario a eliminar.
     * @returns {Promise<void>}
     */
    async remove(id: number) {
        await this.usuariosRepo.delete(id);
    }

    /**
     * @brief Cambia el rol de un usuario existente.
     *
     * @param {number} id         - Identificador del usuario.
     * @param {RolUsuario} nuevoRol - Nuevo rol a asignar (`ADMIN`, `HERMANDAD`, `BANDA`, `COFRADE`).
     * @returns {Promise<Usuario>} Entidad actualizada con el nuevo rol.
     *
     * @throws {NotFoundException} Si el usuario no existe.
     */
    async updateRol(id: number, nuevoRol: RolUsuario) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.rol = nuevoRol;
        return await this.usuariosRepo.save(usuario);
    }

    /**
     * @brief Bloquea o desbloquea una cuenta de usuario y registra el motivo.
     *
     * @details
     * Actualiza los campos `estaBloqueado` y `motivoBloqueo` del usuario. Si no se
     * proporciona motivo, se almacena una cadena vacía. El sistema de autenticación
     * comprueba `estaBloqueado` antes de emitir nuevos tokens.
     *
     * @pre   El usuario debe existir en base de datos.
     * @post  El campo `estaBloqueado` queda actualizado; si `bloqueado` es `false`,
     *        el `motivoBloqueo` persiste en base de datos pero pierde relevancia funcional.
     *
     * @param {number} id          - Identificador del usuario.
     * @param {boolean} bloqueado  - `true` para bloquear, `false` para desbloquear.
     * @param {string} [motivo]    - Descripción opcional del motivo del bloqueo.
     * @returns {Promise<Usuario>} Entidad actualizada.
     *
     * @throws {NotFoundException} Si el usuario no existe.
     */
    async setBloqueo(id: number, bloqueado: boolean, motivo?: string) {
        const usuario = await this.usuariosRepo.findOneBy({ id });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        usuario.estaBloqueado = bloqueado;
        usuario.motivoBloqueo = motivo || '';
        return await this.usuariosRepo.save(usuario);
    }
}
