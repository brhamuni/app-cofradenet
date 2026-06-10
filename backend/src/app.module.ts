import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadesModule } from './ciudades/ciudades.module';
import { HermandadesModule } from './hermandades/hermandades.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { BandasModule } from './bandas/bandas.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { UbicacionModule } from './ubicacion/ubicacion.module';
import { MediaModule } from './media/media.module';
import { ArchivosModule } from './archivos/archivos.module';
import { buildTypeOrmConfig } from './config/database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: join(__dirname, '..', '..', 'config', '.env'),
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: buildTypeOrmConfig,
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
        UbicacionModule,
        MediaModule,
        ArchivosModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
