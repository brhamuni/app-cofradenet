/**
 * @file search.service.ts
 * @brief Servicio de búsqueda global de CofradeNet.
 * @details Proporciona búsqueda unificada sobre ciudades, hermandades, bandas y procesiones,
 *          con soporte para filtrado por categoría y búsqueda insensible a acentos
 *          mediante la extensión `unaccent` de PostgreSQL.
 */

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

    /**
     * @brief Realiza una búsqueda global sobre las entidades principales de la plataforma.
     *
     * @details
     * Ejecuta hasta cuatro consultas independientes según el valor del parámetro `filtro`:
     * - `'todo'`: busca en todas las categorías.
     * - `'ciudades'` / `'hermandades'` / `'bandas'` / `'procesiones'`: solo en la indicada.
     *
     * Características técnicas:
     * - Requiere mínimo 3 caracteres en `query` para evitar búsquedas demasiado amplias.
     * - Usa `unaccent()` de PostgreSQL en ambos lados de la comparación `ILIKE`, permitiendo
     *   que "cofradía" encuentre "cofradia" y viceversa.
     * - La búsqueda de hermandades incluye tanto `nombre` como `nombrePopular` (OR).
     * - Las bandas cargan la relación `ciudad` para que el frontend pueda mostrar la localidad.
     * - Las procesiones se ordenan por `fecha` ascendente y cargan la hermandad titular.
     * - Solo se incluyen procesiones con `fecha` mayor o igual al día actual.
     * - Cada categoría está limitada a 10 resultados.
     *
     * @pre   La extensión `unaccent` debe estar instalada en PostgreSQL
     *        (`CREATE EXTENSION IF NOT EXISTS unaccent`).
     * @post  Las categorías no incluidas en el `filtro` se devuelven como arrays vacíos.
     *
     * @param {string} query           - Término de búsqueda (mínimo 3 caracteres para ejecutar).
     * @param {string} [filtro='todo'] - Categoría a buscar: `'todo'`, `'ciudades'`,
     *        `'hermandades'`, `'bandas'` o `'procesiones'`.
     * @returns {Promise<{ ciudades: Ciudad[]; hermandades: Hermandad[]; bandas: Banda[]; procesiones: Procesion[] }>}
     *          Resultados agrupados por categoría (vacíos si no aplica el filtro o query < 3 chars).
     *
     * @warning Requiere la extensión `unaccent` de PostgreSQL. No es compatible con SQLite
     *          u otros motores sin esta función.
     */
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
        const hoy = new Date().toISOString().split('T')[0];
        const resultados: any = {
            ciudades: [],
            hermandades: [],
            bandas: [],
            procesiones: [],
        };

        if (filtro === 'todo' || filtro === 'ciudades') {
            resultados.ciudades = await this.ciudadesRepository
                .createQueryBuilder('ciudad')
                .where('unaccent(ciudad.nombre) ILIKE unaccent(:patron)', {
                    patron,
                })
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'hermandades') {
            resultados.hermandades = await this.hermandadesRepository
                .createQueryBuilder('hermandad')
                .leftJoinAndSelect('hermandad.ciudad', 'ciudad')
                .where(
                    '(unaccent(hermandad.nombre) ILIKE unaccent(:patron) OR unaccent(hermandad.nombrePopular) ILIKE unaccent(:patron))',
                    { patron },
                )
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'bandas') {
            resultados.bandas = await this.bandasRepository
                .createQueryBuilder('banda')
                .leftJoinAndSelect('banda.ciudad', 'ciudad')
                .where('unaccent(banda.nombre) ILIKE unaccent(:patron)', {
                    patron,
                })
                .take(10)
                .getMany();
        }

        if (filtro === 'todo' || filtro === 'procesiones') {
            resultados.procesiones = await this.procesionesRepository
                .createQueryBuilder('procesion')
                .leftJoinAndSelect('procesion.hermandad', 'hermandad')
                .where('unaccent(procesion.nombre) ILIKE unaccent(:patron)', {
                    patron,
                })
                .andWhere('procesion.fecha >= :hoy', { hoy })
                .orderBy('procesion.fecha', 'ASC')
                .take(10)
                .getMany();
        }

        return resultados;
    }
}
