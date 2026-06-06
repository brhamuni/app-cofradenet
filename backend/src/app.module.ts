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
import { PublicacionesModule } from './publicaciones/publicaciones.module';
import { SeguimientosModule } from './seguimientos/seguimientos.module';
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            username: process.env.DB_USERNAME ?? 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME ?? 'cofradenet_db',
            autoLoadEntities: true,
            synchronize: true,
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
        PublicacionesModule,
        SeguimientosModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
