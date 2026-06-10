import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { serviceUrl } from './config/service-url.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: serviceUrl(
            config.getOrThrow<string>('APP_HOST'),
            config.getOrThrow<string>('FRONTEND_PORT'),
        ),
        credentials: true,
    });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('CofradeNet API')
        .setDescription('API REST de la plataforma integral de gestión cofrade')
        .setVersion('2.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'access-token',
        )
        .addTag('auth', 'Autenticación y sesión')
        .addTag('usuarios', 'Gestión de usuarios')
        .addTag('hermandades', 'Hermandades y cofradías')
        .addTag('bandas', 'Bandas de música')
        .addTag('ciudades', 'Ciudades')
        .addTag('procesiones', 'Procesiones')
        .addTag('participaciones', 'Participaciones de bandas en procesiones')
        .addTag('itinerarios', 'Itinerarios de procesiones')
        .addTag('publicaciones', 'Publicaciones, likes y comentarios')
        .addTag('seguimientos', 'Seguir hermandades, bandas y usuarios')
        .addTag('eventos', 'Eventos')
        .addTag('marchas', 'Marchas procesionales')
        .addTag('search', 'Búsqueda global')
        .addTag('admin', 'Panel de administración')
        .addTag('archivos', 'Archivos multimedia (referencias en PostgreSQL, binarios en MongoDB)')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    await app.listen(parseInt(config.getOrThrow<string>('BACKEND_PORT'), 10));
}
bootstrap();
