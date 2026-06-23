import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seguimiento } from './entities/seguimiento.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

type Objetivo = {
    hermandadId?: number;
    bandaId?: number;
    seguidoUsuarioId?: number;
};

@Injectable()
export class SeguimientosService {
    constructor(
        @InjectRepository(Seguimiento)
        private readonly repo: Repository<Seguimiento>,
    ) {}

    private validarObjetivo(obj: Objetivo) {
        const rellenos = [
            obj.hermandadId,
            obj.bandaId,
            obj.seguidoUsuarioId,
        ].filter(Boolean);
        if (rellenos.length !== 1)
            throw new BadRequestException(
                'Debes especificar exactamente un objetivo a seguir',
            );
    }

    async seguir(
        usuario: Usuario,
        obj: Objetivo,
    ): Promise<{ seguidores: number }> {
        this.validarObjetivo(obj);
        const existe = await this.repo.findOne({
            where: { seguidorId: usuario.id, ...obj },
        });
        if (!existe) {
            await this.repo.save(
                this.repo.create({ seguidorId: usuario.id, ...obj }),
            );
        }
        return { seguidores: await this.contarSeguidores(obj) };
    }

    async dejarDeSeguir(
        usuario: Usuario,
        obj: Objetivo,
    ): Promise<{ seguidores: number }> {
        this.validarObjetivo(obj);
        await this.repo.delete({ seguidorId: usuario.id, ...obj });
        return { seguidores: await this.contarSeguidores(obj) };
    }

    async yoSigo(usuarioId: number, obj: Objetivo): Promise<boolean> {
        const existe = await this.repo.findOne({
            where: { seguidorId: usuarioId, ...obj },
        });
        return !!existe;
    }

    async contarSeguidores(obj: Objetivo): Promise<number> {
        return this.repo.count({ where: obj });
    }

    async estadoParaUsuario(
        usuarioId: number,
        obj: Objetivo,
    ): Promise<{ sigues: boolean; seguidores: number }> {
        const [sigues, seguidores] = await Promise.all([
            this.yoSigo(usuarioId, obj),
            this.contarSeguidores(obj),
        ]);
        return { sigues, seguidores };
    }
}
