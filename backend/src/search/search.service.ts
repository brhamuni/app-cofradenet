import { Banda } from '@backend/bandas/entities/banda.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadesRepository: Repository<Ciudad>,
        @InjectRepository(Hermandad)
        private readonly hermandadesRepository: Repository<Hermandad>,
        @InjectRepository(Banda)
        private readonly bandasRepository: Repository<Banda>,
        @InjectRepository(Procesion)
        private readonly procesionesRepository: Repository<Procesion>,
    ) {}

    async globalSearch(query: string, filtro: string = 'todo') {
        if (!query || query.trim().length < 3) {
            return {
                ciudades: [],
                hermandades: [],
                bandas: [],
                procesiones: [],
            };
        }

        const patron = `%${query}%`;
        const resultados: any = {
            ciudades: [],
            hermandades: [],
            bandas: [],
            procesiones: [],
        };

        if (filtro === 'todo' || filtro === 'ciudades') {
            resultados.ciudades = await this.ciudadesRepository
                .createQueryBuilder('ciudad')
                .where('unaccent(ciudad.nombre) ILIKE unaccent(:patron)', { patron })
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'hermandades') {
            resultados.hermandades = await this.hermandadesRepository
                .createQueryBuilder('hermandad')
                .leftJoinAndSelect('hermandad.ciudad', 'ciudad')
                // Añadido: Búsqueda por nombre OR nombrePopular
                .where(
                    '(unaccent(hermandad.nombre) ILIKE unaccent(:patron) OR unaccent(hermandad.nombrePopular) ILIKE unaccent(:patron))',
                    { patron }
                )
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'bandas') {
            resultados.bandas = await this.bandasRepository
                .createQueryBuilder('banda')
                // Añadido: join con ciudad para que el frontend pueda mostrar de dónde es
                .leftJoinAndSelect('banda.ciudad', 'ciudad') 
                .where('unaccent(banda.nombre) ILIKE unaccent(:patron)', { patron })
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'procesiones') {
            resultados.procesiones = await this.procesionesRepository
                .createQueryBuilder('procesion')
                .leftJoinAndSelect('procesion.hermandad', 'hermandad')
                .where('unaccent(procesion.nombre) ILIKE unaccent(:patron)', { patron })
                .orderBy('procesion.fecha', 'ASC')
                .take(10)
                .getMany();
        }

        return resultados;
    }
}