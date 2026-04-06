import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ciudad } from '../ciudades/entities/ciudad.entity'; // Asegúrate de la ruta
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
    ) {}

    async runSeed() {
        const count = await this.ciudadRepository.count();

        if (count > 0) {
            console.log(
                `✅ La tabla ya tiene ${count} registros. Omitiendo siembra.`,
            );
            return;
        }

        console.log('🌱 Base de datos vacía. Leyendo el archivo CSV...');

        // 1. Buscamos el archivo CSV
        const filePath = path.join(
            process.cwd(),
            'src',
            'seed',
            'data',
            'ciudades.csv',
        );
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // 2. Separamos el archivo por saltos de línea
        const lineas = fileContent.split(/\r?\n/);
        const ciudadesAInsertar: {
            nombre: string;
            provincia: string;
            pais: string;
        }[] = [];

        // 3. Procesamos cada línea del CSV
        for (const linea of lineas) {
            // Si la línea está vacía, la saltamos
            if (!linea.trim()) continue;

            // Separamos por punto y coma
            const columnas = linea.split(';');

            // columnas[0] = "Andalucía"
            // columnas[1] = "Almería"
            // columnas[2] = "Abla"

            // Nos aseguramos de que la línea tiene al menos los 3 primeros datos
            if (columnas.length >= 3) {
                ciudadesAInsertar.push({
                    nombre: columnas[2].trim(),
                    provincia: columnas[1].trim(),
                    pais: 'España', // Lo ponemos por defecto
                });
            }
        }

        console.log(
            `🎯 Se han extraído ${ciudadesAInsertar.length} pueblos. Empezando a insertar...`,
        );

        // 4. Insertamos en la base de datos por lotes
        try {
            const chunkSize = 1000;
            for (let i = 0; i < ciudadesAInsertar.length; i += chunkSize) {
                const chunk = ciudadesAInsertar.slice(i, i + chunkSize);
                await this.ciudadRepository.insert(chunk);
                console.log(
                    `📦 Lote insertado: de la ${i} a la ${i + chunk.length}`,
                );
            }
            console.log('✅ ¡BUM! Todas las ciudades insertadas desde el CSV.');
        } catch (error) {
            console.error('❌ Error al insertar en la base de datos:', error);
        }
    }
}
