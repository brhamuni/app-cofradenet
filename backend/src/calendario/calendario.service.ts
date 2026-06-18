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
    fecha: Date;
    hora?: string;
    ciudad?: string;
    ciudadId?: number;
    lugar?: string;
    hermandad?: { id: number; nombre: string; nombrePopular?: string; imagenEscudo?: string };
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
        const seguimientos = await this.seguimientoRepo.find({ where: { seguidorId: userId } });

        const hermandadIds = seguimientos.filter((s) => s.hermandadId).map((s) => s.hermandadId);
        const bandaIds = seguimientos.filter((s) => s.bandaId).map((s) => s.bandaId);

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
                if (ciudadId && (e.banda as any)?.ciudadId !== ciudadId) continue;
                resultados.push({
                    id: e.id,
                    tipo: 'concierto',
                    titulo: e.titulo,
                    fecha: e.fechaHora,
                    hora: e.fechaHora
                        ? new Date(e.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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

        resultados.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        return resultados;
    }
}
