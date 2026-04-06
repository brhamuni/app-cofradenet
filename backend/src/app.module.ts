import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadesModule } from './ciudades/ciudades.module';
import { HermandadesModule } from './hermandades/hermandades.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { BandasModule } from './bandas/bandas.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { MarchasModule } from './marchas/marchas.module';
import { ProcesionesModule } from './procesiones/procesiones.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParticipacionesModule } from './participaciones/participaciones.module';
import { EventosModule } from './eventos/eventos.module';
import { ItinerariosModule } from './itinerarios/itinerarios.module';
import { SeedModule } from './seed/seed.module';
import { SearchModule } from './search/search.module';
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
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
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        CiudadesModule,
        HermandadesModule,
        UsuariosModule,
        BandasModule,
        AuthModule,
        AdminModule,
        MarchasModule,
        ProcesionesModule,
        ParticipacionesModule,
        EventosModule,
        ItinerariosModule,
        SeedModule,
        SearchModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
