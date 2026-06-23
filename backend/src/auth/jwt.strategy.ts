import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as passportJwt from 'passport-jwt';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

const ExtractJwt = passportJwt.ExtractJwt;
const Strategy = passportJwt.Strategy;

interface JwtPayload {
    id: number;
    username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET no encontrado en el .env');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        const usuario = await this.usuariosRepo.findOne({
            where: { id: payload.id },
        });

        if (!usuario) {
            throw new UnauthorizedException('Acceso no autorizado');
        }

        return {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
        };
    }
}
