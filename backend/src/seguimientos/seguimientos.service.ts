/**
 * @file seguimientos.service.ts
 * @brief Servicio de gestión de seguimientos entre usuarios y entidades de CofradeNet.
 * @details Permite seguir y dejar de seguir hermandades, bandas y otros usuarios.
 *          Garantiza que cada operación apunte a exactamente un objetivo y devuelve
 *          el recuento actualizado de seguidores tras cada acción.
 */

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

    /**
     * @brief Valida que el objeto objetivo especifique exactamente un destino de seguimiento.
     *
     * @details
     * Cuenta cuántos campos del objeto `Objetivo` son truthy. Si el resultado no es
     * exactamente 1, lanza `BadRequestException`. Esto garantiza que cada seguimiento
     * apunte únicamente a una hermandad, una banda o un usuario, nunca a múltiples
     * ni a ninguno.
     *
     * @param {Objetivo} obj - Objeto con los campos opcionales del destino de seguimiento.
     * @throws {BadRequestException} Si se especifican 0 o más de 1 objetivos simultáneamente.
     */
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

    /**
     * @brief Crea un seguimiento del usuario hacia el objetivo indicado (idempotente).
     *
     * @details
     * Verifica primero que el seguimiento no exista ya para evitar duplicados.
     * Si ya existe, no realiza ninguna operación de escritura (idempotente).
     * Tras la operación, devuelve el recuento actualizado de seguidores del objetivo.
     *
     * @pre   El objetivo debe especificar exactamente un campo (`hermandadId`, `bandaId`
     *        o `seguidoUsuarioId`).
     * @post  Existe exactamente un registro de seguimiento para el par `(seguidorId, objetivo)`.
     *
     * @param {Usuario} usuario  - Usuario autenticado que realiza el seguimiento.
     * @param {Objetivo} obj     - Destino del seguimiento.
     * @returns {Promise<{ seguidores: number }>} Recuento total de seguidores del objetivo.
     *
     * @throws {BadRequestException} Si el objetivo no es válido.
     */
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

    /**
     * @brief Elimina el seguimiento del usuario hacia el objetivo indicado.
     *
     * @details
     * Operación idempotente: si el seguimiento no existe, el `DELETE` no afecta
     * ninguna fila y no se produce error. Devuelve el recuento actualizado tras la operación.
     *
     * @param {Usuario} usuario  - Usuario autenticado que deja de seguir.
     * @param {Objetivo} obj     - Destino del seguimiento a eliminar.
     * @returns {Promise<{ seguidores: number }>} Recuento total de seguidores del objetivo.
     *
     * @throws {BadRequestException} Si el objetivo no es válido.
     */
    async dejarDeSeguir(
        usuario: Usuario,
        obj: Objetivo,
    ): Promise<{ seguidores: number }> {
        this.validarObjetivo(obj);
        await this.repo.delete({ seguidorId: usuario.id, ...obj });
        return { seguidores: await this.contarSeguidores(obj) };
    }

    /**
     * @brief Comprueba si un usuario sigue a un objetivo concreto.
     *
     * @param {number} usuarioId - Identificador del usuario seguidor.
     * @param {Objetivo} obj     - Destino del seguimiento a consultar.
     * @returns {Promise<boolean>} `true` si el usuario sigue al objetivo, `false` en caso contrario.
     */
    async yoSigo(usuarioId: number, obj: Objetivo): Promise<boolean> {
        const existe = await this.repo.findOne({
            where: { seguidorId: usuarioId, ...obj },
        });
        return !!existe;
    }

    /**
     * @brief Cuenta el número total de seguidores de un objetivo.
     *
     * @param {Objetivo} obj - Destino del que se quiere contar los seguidores.
     * @returns {Promise<number>} Número de seguidores del objetivo.
     */
    async contarSeguidores(obj: Objetivo): Promise<number> {
        return this.repo.count({ where: obj });
    }

    /**
     * @brief Obtiene de forma combinada si el usuario sigue el objetivo y su recuento de seguidores.
     *
     * @details
     * Ejecuta `yoSigo` y `contarSeguidores` en paralelo con `Promise.all` para minimizar
     * la latencia total, ya que ambas consultas son independientes entre sí.
     *
     * @param {number} usuarioId - Identificador del usuario cuyo estado se consulta.
     * @param {Objetivo} obj     - Destino del seguimiento.
     * @returns {Promise<{ sigues: boolean; seguidores: number }>}
     *          Estado de seguimiento del usuario y recuento total de seguidores.
     */
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

    /**
     * @brief Lista hermandades y bandas que sigue el usuario autenticado.
     */
    async listarMisSeguimientos(usuarioId: number) {
        const seguimientos = await this.repo.find({
            where: { seguidorId: usuarioId },
            relations: ['hermandad', 'hermandad.ciudad', 'banda', 'banda.ciudad'],
            order: { fecha: 'DESC' },
        });

        const hermandades = seguimientos
            .filter((s) => s.hermandadId && s.hermandad)
            .map((s) => ({
                id: s.hermandad!.id,
                nombre: s.hermandad!.nombrePopular || s.hermandad!.nombre,
                imagenEscudo: s.hermandad!.imagenEscudo,
                ciudad: s.hermandad!.ciudad?.nombre ?? null,
            }));

        const bandas = seguimientos
            .filter((s) => s.bandaId && s.banda)
            .map((s) => ({
                id: s.banda!.id,
                nombre: s.banda!.nombre,
                imagenLogo: s.banda!.imagenLogo,
                ciudad: s.banda!.ciudad?.nombre ?? null,
            }));

        return { hermandades, bandas };
    }
}
