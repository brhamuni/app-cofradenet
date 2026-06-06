import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
        credentials: true,
    });

    const config = new DocumentBuilder()
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
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
