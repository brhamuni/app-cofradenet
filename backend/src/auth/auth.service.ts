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
