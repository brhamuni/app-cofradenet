/**
 * @file auth.service.ts
 * @brief Servicio de autenticación de la plataforma CofradeNet.
 * @details Gestiona el ciclo completo de sesión de usuario: inicio de sesión
 *          con credenciales, renovación de tokens y cierre de sesión.
 *          Utiliza JWT para el access token y UUID aleatorio para el refresh token,
 *          que se persiste en base de datos junto al usuario.
 */

import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { LoginUsuarioDto } from '@backend/usuarios/dto/login-usuario';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * @brief Autentica a un usuario mediante sus credenciales y genera tokens de sesión.
     *
     * @details
     * El proceso de autenticación sigue estos pasos:
     * 1. Busca al usuario por `username` O por `email` (el campo `username` del DTO
     *    puede contener cualquiera de los dos). La consulta usa `addSelect` para
     *    incluir el campo `password`, que está excluido por defecto en la entidad.
     * 2. Compara la contraseña en texto plano con el hash almacenado mediante `bcrypt`.
     * 3. Genera un `access_token` JWT firmado con el payload `{ id, username, rol }`.
     * 4. Genera un `refresh_token` UUID v4 aleatorio, lo persiste en la entidad del
     *    usuario y lo devuelve al cliente para su uso posterior en `/auth/refresh`.
     *
     * @pre   La base de datos debe contener al menos un usuario registrado.
     * @post  El campo `refreshToken` del usuario queda actualizado en base de datos.
     *
     * @param {LoginUsuarioDto} loginDTO - DTO con `username` (admite email) y `password`.
     * @returns {Promise<object>} Objeto con `mensaje`, `access_token`, `refresh_token`
     *          e información básica del usuario (`id`, `nombre`, `rol`).
     *
     * @throws {UnauthorizedException} Si el usuario no existe o la contraseña no coincide.
     */
    async login(loginDTO: LoginUsuarioDto) {
        const { username, password } = loginDTO;
        const usuario = await this.usuarioRepository
            .createQueryBuilder('usuario')
            .addSelect('usuario.password')
            .where('usuario.username = :val', { val: username })
            .orWhere('usuario.email = :val', { val: username })
            .getOne();

        if (!usuario) throw new UnauthorizedException('El login no existe');

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido)
            throw new UnauthorizedException('Contraseña incorrecta');

        const payload = {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
        };
        const refreshToken = randomUUID();

        usuario.refreshToken = refreshToken;
        await this.usuarioRepository.save(usuario);

        return {
            mensaje: 'Login exitoso',
            access_token: this.jwtService.sign(payload),
            refresh_token: refreshToken,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
            },
        };
    }

    /**
     * @brief Renueva el access token JWT a partir de un refresh token válido.
     *
     * @details
     * Busca en base de datos al usuario cuyo campo `refreshToken` coincida con el
     * valor recibido. Si se encuentra, invalida el refresh token actual (rotación)
     * generando uno nuevo con `randomUUID()`, lo persiste y emite un nuevo par de tokens.
     * Esta estrategia de rotación garantiza que cada refresh token solo pueda usarse
     * una vez, reduciendo la ventana de exposición ante robos de token.
     *
     * @pre   El cliente debe haber iniciado sesión previamente y conservar el refresh token.
     * @post  El campo `refreshToken` del usuario queda actualizado en base de datos con el
     *        nuevo valor; el token anterior queda invalidado.
     *
     * @param {string | undefined} refreshToken - Token de refresco UUID almacenado en cookie o cliente.
     * @returns {Promise<object>} Objeto con nuevo `access_token` y nuevo `refresh_token`.
     *
     * @throws {UnauthorizedException} Si `refreshToken` es undefined, nulo o no existe en BD.
     */
    async refresh(refreshToken: string | undefined) {
        if (!refreshToken)
            throw new UnauthorizedException('No hay refresh token');

        const usuario = await this.usuarioRepository.findOne({
            where: { refreshToken },
        });
        if (!usuario)
            throw new UnauthorizedException(
                'Refresh token inválido o expirado',
            );

        const newRefreshToken = randomUUID();
        usuario.refreshToken = newRefreshToken;
        await this.usuarioRepository.save(usuario);

        const payload = {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
        };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: newRefreshToken,
        };
    }

    /**
     * @brief Cierra la sesión del usuario invalidando su refresh token en base de datos.
     *
     * @details
     * Realiza un `UPDATE` masivo sobre todos los registros cuyo `refreshToken` coincida
     * con el proporcionado, estableciéndolo a `null`. La operación es idempotente: si el
     * token ya era nulo o no existía, no se produce ningún error.
     *
     * @param {string | undefined} refreshToken - Token de refresco a invalidar. Si es
     *        `undefined`, la operación se omite silenciosamente.
     * @returns {Promise<object>} Objeto con `mensaje` confirmando el cierre de sesión.
     */
    async logout(refreshToken: string | undefined) {
        if (refreshToken) {
            await this.usuarioRepository.update(
                { refreshToken },
                { refreshToken: null },
            );
        }
        return { mensaje: 'Sesión cerrada' };
    }
}
