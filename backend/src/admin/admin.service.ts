import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
    ) {}

    async findAllUsers(): Promise<Usuario[]> {
        return this.usuariosRepo.find({
            select: ['id', 'username', 'email', 'rol'],
        });
    }

    async verificarUsuario(id: number) {
        const usuario = await this.usuariosRepo.findOneBy({ id });

        if (!usuario) {
            throw new NotFoundException(
                'No se encontró el usuario para verificar',
            );
        }

        // Cambiamos el estado a true
        usuario.verificado = true;
        await this.usuariosRepo.save(usuario);

        return {
            message: 'Usuario verificado correctamente',
            id: usuario.id,
            verificado: usuario.verificado,
        };
    }
}
