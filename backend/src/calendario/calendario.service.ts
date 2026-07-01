/**
 * @file calendario.service.ts
 * @brief Servicio de calendario personalizado de eventos de CofradeNet.
 * @details Agrega procesiones de hermandades seguidas y eventos de bandas seguidas
 *          en una vista unificada de calendario. Soporta filtrado por tipo de evento
 *          y por ciudad, agrupación por mes y consulta de detalle individual.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';

export type TipoFiltro = 'all' | 'procesion' | 'concierto';

export interface EventoCalendario {
    id: number;
    tipo: 'procesion' | 'concierto';
    titulo: string;
    fecha: Date | string;
    hora?: string;
    ciudad?: string;
    ciudadId?: number;
    lugar?: string;
    hermandad?: {
        id: number;
        nombre: string;
        nombrePopular?: string;
        imagenEscudo?: string;
    };
    banda?: { id: number; nombre: string; imagenLogo?: string };
}

@Injectable()
export class CalendarioService {
    constructor(
        @InjectRepository(Seguimiento)
        private readonly seguimientoRepo: Repository<Seguimiento>,
        @InjectRepository(Procesion)
        private readonly procesionRepo: Repository<Procesion>,
        @InjectRepository(Evento)
        private readonly eventoRepo: Repository<Evento>,
    ) {}

    /**
     * @brief Obtiene todos los eventos del calendario personalizado de un usuario.
     *
     * @details
     * Construye el calendario en tres fases:
     * 1. Recupera los seguimientos del usuario para extraer `hermandadIds` y `bandaIds`.
     * 2. Si `tipo !== 'concierto'` y hay hermandades seguidas, consulta las procesiones
     *    de esas hermandades con sus ciudades. Filtra opcionalmente por `ciudadId` en memoria.
     * 3. Si `tipo !== 'procesion'` y hay bandas seguidas, consulta los eventos de esas bandas.
     *    También filtra por `ciudadId` en memoria si se proporciona.
     *
     * El resultado se normaliza al tipo `EventoCalendario` para homogeneizar procesiones
     * y conciertos en una sola lista, y se ordena cronológicamente.
     *
     * @pre   El usuario debe tener al menos un seguimiento para recibir eventos.
     * @post  El array devuelto está ordenado por `fecha` ascendente.
     *
     * @param {number} userId              - Identificador del usuario autenticado.
     * @param {TipoFiltro} [tipo='all']    - Filtro de tipo: `'all'`, `'procesion'` o `'concierto'`.
     * @param {number} [ciudadId]          - Filtro opcional por ciudad (filtra en memoria).
     * @returns {Promise<EventoCalendario[]>} Lista unificada de eventos del calendario.
     */
    async getMisEventos(
        userId: number,
        tipo: TipoFiltro = 'all',
        ciudadId?: number,
    ): Promise<EventoCalendario[]> {
        const seguimientos = await this.seguimientoRepo.find({
            where: { seguidorId: userId },
        });

        const hermandadIds = seguimientos
            .filter((s) => s.hermandadId)
            .map((s) => s.hermandadId);
        const bandaIds = seguimientos
            .filter((s) => s.bandaId)
            .map((s) => s.bandaId);

        const resultados: EventoCalendario[] = [];

        if (tipo !== 'concierto' && hermandadIds.length > 0) {
            const procesiones = await this.procesionRepo
                .createQueryBuilder('p')
                .leftJoinAndSelect('p.hermandad', 'h')
                .leftJoinAndSelect('h.ciudad', 'c')
                .where('p.hermandadId IN (:...ids)', { ids: hermandadIds })
                .andWhere('p.fecha IS NOT NULL')
                .orderBy('p.fecha', 'ASC')
                .addOrderBy('p.horaSalida', 'ASC')
                .getMany();

            for (const p of procesiones) {
                if (ciudadId && p.hermandad?.ciudadId !== ciudadId) continue;
                resultados.push({
                    id: p.id,
                    tipo: 'procesion',
                    titulo: p.nombre,
                    fecha: p.fecha,
                    hora: p.horaSalida,
                    ciudad: (p.hermandad as any)?.ciudad?.nombre,
                    ciudadId: p.hermandad?.ciudadId,
                    hermandad: p.hermandad
                        ? {
                              id: p.hermandad.id,
                              nombre: p.hermandad.nombre,
                              nombrePopular: p.hermandad.nombrePopular,
                              imagenEscudo: p.hermandad.imagenEscudo,
                          }
                        : undefined,
                });
            }
        }

        if (tipo !== 'procesion' && bandaIds.length > 0) {
            const eventos = await this.eventoRepo
                .createQueryBuilder('e')
                .leftJoinAndSelect('e.banda', 'b')
                .leftJoinAndSelect('b.ciudad', 'c')
                .where('e.bandaId IN (:...ids)', { ids: bandaIds })
                .orderBy('e.fechaHora', 'ASC')
                .getMany();

            for (const e of eventos) {
                if (ciudadId && (e.banda as any)?.ciudadId !== ciudadId)
                    continue;
                resultados.push({
                    id: e.id,
                    tipo: 'concierto',
                    titulo: e.titulo,
                    fecha: e.fechaHora,
                    hora: e.fechaHora
                        ? new Date(e.fechaHora).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : undefined,
                    ciudad: (e.banda as any)?.ciudad?.nombre,
                    ciudadId: (e.banda as any)?.ciudadId,
                    lugar: e.lugar,
                    banda: e.banda
                        ? {
                              id: e.banda.id,
                              nombre: e.banda.nombre,
                              imagenLogo: e.banda.imagenLogo,
                          }
                        : undefined,
                });
            }
        }

        resultados.sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        );
        return resultados;
    }

    /**
     * @brief Obtiene los eventos del calendario de un usuario agrupados por día para un mes concreto.
     *
     * @details
     * Reutiliza `getMisEventos` con filtro `'all'` y filtra el resultado en memoria
     * por año y mes. Luego agrupa los eventos por clave ISO de fecha (`YYYY-MM-DD`)
     * en un `Record<string, EventoCalendario[]>`.
     *
     * @param {number} userId - Identificador del usuario.
     * @param {number} anio   - Año del mes a consultar.
     * @param {number} mes    - Mes a consultar (1-12).
     * @returns {Promise<Record<string, EventoCalendario[]>>} Mapa de fecha ISO → eventos del día.
     */
    async getMisEventosMes(
        userId: number,
        anio: number,
        mes: number,
    ): Promise<Record<string, EventoCalendario[]>> {
        const todos = await this.getMisEventos(userId, 'all');
        const delMes = todos.filter((ev) => {
            const d = new Date(ev.fecha);
            return d.getFullYear() === anio && d.getMonth() + 1 === mes;
        });
        const agrupados: Record<string, EventoCalendario[]> = {};
        for (const ev of delMes) {
            const key = new Date(ev.fecha).toISOString().slice(0, 10);
            if (!agrupados[key]) agrupados[key] = [];
            agrupados[key].push(ev);
        }
        return agrupados;
    }

    /**
     * @brief Obtiene el detalle de un evento individual del calendario por tipo e identificador.
     *
     * @details
     * Dependiendo del `tipo`, consulta el repositorio correspondiente:
     * - `'procesion'`: carga la procesión con `hermandad → ciudad`.
     * - `'concierto'`: carga el evento con `banda → ciudad`.
     * El resultado se normaliza al tipo `EventoCalendario` para coherencia con el resto de la API.
     *
     * @param {'procesion' | 'concierto'} tipo - Tipo del evento a consultar.
     * @param {number} id                      - Identificador del evento.
     * @returns {Promise<EventoCalendario | null>} Detalle del evento o `null` si no existe.
     */
    async getEventoById(
        tipo: 'procesion' | 'concierto',
        id: number,
    ): Promise<EventoCalendario | null> {
        if (tipo === 'procesion') {
            const p = await this.procesionRepo.findOne({
                where: { id },
                relations: ['hermandad', 'hermandad.ciudad'],
            });
            if (!p) return null;
            return {
                id: p.id,
                tipo: 'procesion',
                titulo: p.nombre,
                fecha: p.fecha,
                hora: p.horaSalida,
                ciudad: (p.hermandad as any)?.ciudad?.nombre,
                ciudadId: p.hermandad?.ciudadId,
                hermandad: p.hermandad
                    ? {
                          id: p.hermandad.id,
                          nombre: p.hermandad.nombre,
                          nombrePopular: p.hermandad.nombrePopular,
                          imagenEscudo: p.hermandad.imagenEscudo,
                      }
                    : undefined,
            };
        }
        const e = await this.eventoRepo.findOne({
            where: { id },
            relations: ['banda', 'banda.ciudad'],
        });
        if (!e) return null;
        return {
            id: e.id,
            tipo: 'concierto',
            titulo: e.titulo,
            fecha: e.fechaHora,
            lugar: e.lugar,
            ciudad: (e.banda as any)?.ciudad?.nombre,
            ciudadId: (e.banda as any)?.ciudadId,
            banda: e.banda
                ? {
                      id: e.banda.id,
                      nombre: e.banda.nombre,
                      imagenLogo: e.banda.imagenLogo,
                  }
                : undefined,
        };
    }
}
