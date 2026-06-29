import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { RolUsuario, Usuario } from '../usuarios/entities/usuario.entity';
import { Hermandad } from '../hermandades/entities/hermandad.entity';
import { Procesion } from '../procesiones/entities/procesion.entity';
import { Paso } from '../procesiones/entities/paso.entity';
import { Banda } from '../bandas/entities/banda.entity';
import { Participacion } from '../participaciones/entities/participacion.entity';

interface PasoSeed {
    nombre: string;
    tipo: string;
    orden: number;
}

interface BandaParticipacionSeed {
    bandaNombre: string;
    ubicacion: string;
}

interface ProcesonSeed {
    nombre: string;
    /** Days relative to Easter Sunday. 0 = Easter, -7 = Palm Sunday, -2 = Good Friday, etc. */
    diaOffset: number;
    diaSemana: string;
    horaSalida: string;
    horaEntrada: string | null;
    pasos: PasoSeed[];
    bandas: BandaParticipacionSeed[];
}

interface HermandadSeed {
    nombre: string;
    nombrePopular: string;
    titulares: string[];
    añoFundacion: number | null;
    templo: string;
    direccion: string | null;
    diaSalida: string;
    descripcion: string | null;
    procesiones: ProcesonSeed[];
}

interface BandaSeed {
    nombre: string;
    estiloMusical: string;
    localidad: string;
    direccion?: string;
    codigoPostal?: string;
    numeroComponentes?: number;
    historia?: string;
}

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @InjectRepository(Hermandad)
        private readonly hermandadRepository: Repository<Hermandad>,
        @InjectRepository(Procesion)
        private readonly procesionRepository: Repository<Procesion>,
        @InjectRepository(Paso)
        private readonly pasoRepository: Repository<Paso>,
        @InjectRepository(Banda)
        private readonly bandaRepository: Repository<Banda>,
        @InjectRepository(Participacion)
        private readonly participacionRepository: Repository<Participacion>,
    ) {}

    async onModuleInit() {
        try {
            await this.runSeed();
        } catch (err) {
            console.error('❌ Seed falló:', err);
            throw err;
        }
    }

    async runSeed() {
        console.log('🚀 Iniciando seed...');
        await this.seedCiudades();
        await this.seedAdmin();
        await this.seedBandas();
        await this.seedHermandades();
        console.log('🎉 Seed completado.');
    }

    private async seedCiudades() {
        const count = await this.ciudadRepository.count();

        if (count > 0) {
            console.log(`✅ Ciudades: ${count} registros. Omitiendo siembra.`);
            return;
        }

        console.log('🌱 Base de datos vacía. Leyendo ciudades.csv...');

        const filePath = path.join(__dirname, 'data', 'ciudades.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lineas = fileContent.split(/\r?\n/);
        const ciudadesAInsertar: {
            nombre: string;
            provincia: string;
            pais: string;
        }[] = [];

        for (const linea of lineas) {
            if (!linea.trim()) continue;
            const columnas = linea.split(';');
            if (columnas.length >= 3) {
                ciudadesAInsertar.push({
                    nombre: columnas[2].trim(),
                    provincia: columnas[1].trim(),
                    pais: 'España',
                });
            }
        }

        console.log(
            `🎯 ${ciudadesAInsertar.length} pueblos extraídos. Insertando...`,
        );

        const chunkSize = 1000;
        for (let i = 0; i < ciudadesAInsertar.length; i += chunkSize) {
            const chunk = ciudadesAInsertar.slice(i, i + chunkSize);
            await this.ciudadRepository.insert(chunk);
            console.log(`📦 Lote insertado: ${i}–${i + chunk.length}`);
        }

        console.log('✅ Ciudades insertadas.');
    }

    private async seedAdmin() {
        const email = 'admin@test.com';
        const existing = await this.usuarioRepository.findOne({
            where: { email },
        });

        if (existing) {
            console.log(`✅ Admin ya existe (${email}).`);
            return;
        }

        const password = await bcrypt.hash('adminpass', 10);
        await this.usuarioRepository.save({
            nombre: 'Administrador',
            username: 'admin',
            email,
            password,
            rol: RolUsuario.ADMIN,
            verificado: true,
        });

        console.log(`✅ Admin creado: ${email} / adminpass`);
    }

    private async seedBandas() {
        const count = await this.bandaRepository.count();
        if (count > 0) {
            console.log(`✅ Bandas: ${count} registros. Omitiendo siembra.`);
            return;
        }

        const filePath = path.join(__dirname, 'data', 'bandas.json');
        const bandas: BandaSeed[] = JSON.parse(
            fs.readFileSync(filePath, 'utf-8'),
        );

        console.log('🌱 Sembrando bandas...');
        for (const b of bandas) {
            const ciudad = await this.ciudadRepository.findOne({
                where: { nombre: b.localidad },
            });
            await this.bandaRepository.save({
                nombre: b.nombre,
                estiloMusical: b.estiloMusical,
                localidad: b.localidad,
                direccion: b.direccion ?? null,
                codigoPostal: b.codigoPostal ?? null,
                numeroComponentes: b.numeroComponentes ?? null,
                historia: b.historia ?? null,
                ciudadId: ciudad?.id ?? null,
                verificada: true,
            } as Banda);
        }
        console.log(`✅ ${bandas.length} bandas creadas.`);
    }

    private async seedHermandades() {
        const count = await this.hermandadRepository.count();
        if (count > 0) {
            console.log(`✅ Hermandades: ${count} registros. Omitiendo siembra.`);
            return;
        }

        const andujar = await this.ciudadRepository.findOne({
            where: { nombre: 'Andújar' },
        });
        if (!andujar) {
            throw new Error(
                '❌ Ciudad Andújar no encontrada en BD. seedCiudades debe ejecutarse primero.',
            );
        }

        const todasBandas = await this.bandaRepository.find();
        const bandaMap = new Map<string, Banda>();
        for (const b of todasBandas) {
            bandaMap.set(b.nombre, b);
        }

        const filePath = path.join(__dirname, 'data', 'hermandades.json');
        const hermandades: HermandadSeed[] = JSON.parse(
            fs.readFileSync(filePath, 'utf-8'),
        );

        console.log('🌱 Sembrando hermandades, procesiones y pasos...');

        for (const hdData of hermandades) {
            const hermandad = await this.hermandadRepository.save({
                nombre: hdData.nombre,
                nombrePopular: hdData.nombrePopular,
                titulares: hdData.titulares,
                añoFundacion: hdData.añoFundacion,
                templo: hdData.templo,
                direccion: hdData.direccion,
                diaSalida: hdData.diaSalida,
                descripcion: hdData.descripcion,
                ciudadId: andujar.id,
                usuarioId: null,
                verificada: true,
            } as Hermandad);

            for (const year of [2026, 2027]) {
                const easter = this.getEasterDate(year);

                for (const proc of hdData.procesiones) {
                    const fechaDate = this.addDays(easter, proc.diaOffset);
                    const fecha = this.dateToString(fechaDate);

                    const procesion = await this.procesionRepository.save({
                        nombre: `${proc.nombre} ${year}`,
                        diaSemana: proc.diaSemana,
                        fecha,
                        horaSalida: proc.horaSalida,
                        horaEntrada: proc.horaEntrada,
                        hermandad,
                    } as Procesion);

                    for (const paso of proc.pasos) {
                        await this.pasoRepository.save({
                            nombre: paso.nombre,
                            tipo: paso.tipo,
                            orden: paso.orden,
                            procesionId: procesion.id,
                        });
                    }

                    for (const bandaRef of proc.bandas) {
                        const banda = bandaMap.get(bandaRef.bandaNombre);
                        if (!banda) {
                            console.warn(
                                `⚠️ Banda no encontrada: ${bandaRef.bandaNombre}`,
                            );
                            continue;
                        }
                        await this.participacionRepository.save({
                            anio: year,
                            ubicacion: bandaRef.ubicacion,
                            bandaId: banda.id,
                            procesionId: procesion.id,
                        });
                    }
                }
            }

            console.log(`✅ ${hdData.nombrePopular} creada.`);
        }

        console.log('✅ Todas las hermandades sembradas.');
    }

    /** Gregorian Easter algorithm (Meeus/Jones/Butcher) */
    private getEasterDate(year: number): Date {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    private addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    private dateToString(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
