import { Module } from '@nestjs/common';
import { BandasService } from './bandas.service';
import { BandasController } from './bandas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';
import { EnlaceExterno } from './entities/enlace-externo.entity';
import { ArchivosModule } from '@backend/archivos/archivos.module';
import { MediaModule } from '@backend/media/media.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Banda,
            Marcha,
            Participacion,
            Evento,
            EnlaceExterno,
        ]),
        ArchivosModule,
        MediaModule,
    ],
    controllers: [BandasController],
    providers: [BandasService],
    exports: [TypeOrmModule],
})
export class BandasModule {}
