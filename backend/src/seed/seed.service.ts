import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { RolUsuario, Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
    ) {}

    async onModuleInit() {
        await this.runSeed();
    }

    async runSeed() {
        await this.seedCiudades();
        await this.seedAdmin();
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
}
