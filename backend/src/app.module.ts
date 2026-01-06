import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadesModule } from './ciudades/ciudades.module';
import { HermandadesModule } from './hermandades/hermandades.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres', // Este es el usuario por defecto
            password: '***REMOVED***', // La que pusiste en la instalación
            database: 'cofradenet_db', // El nombre que creamos en pgAdmin
            autoLoadEntities: true, // Esto busca tus clases @Entity automáticamente
            synchronize: true, // ¡Magia! Crea las tablas solo mirando tus clases
        }),
        CiudadesModule,
        HermandadesModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
