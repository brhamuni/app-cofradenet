import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
        if (!usuario) {
            throw new UnauthorizedException('El login no existe');
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        const payload = { id: usuario.id, username: usuario.username };

        console.log('login', loginDTO);

        return {
            mensaje: 'Login exitoso',
            access_token: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
            },
        };
    }
}
