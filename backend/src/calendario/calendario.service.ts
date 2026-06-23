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
