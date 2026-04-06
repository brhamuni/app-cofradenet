import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
    console.log('Arrancando contexto de NestJS para Seeding...');

    // Creamos un contexto de aplicación (sin levantar el servidor HTTP)
    const app = await NestFactory.createApplicationContext(AppModule);

    // Extraemos nuestro servicio
    const seedService = app.get(SeedService);

    // Ejecutamos la siembra
    await seedService.runSeed();

    // Cerramos la aplicación
    await app.close();
    console.log('Script de siembra finalizado.');
}

bootstrap();
