import { Module } from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { HermandadesController } from './hermandades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hermandad } from './entities/hermandad.entity';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { ArchivosModule } from '@backend/archivos/archivos.module';
import { MediaModule } from '@backend/media/media.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Hermandad, Ciudad]),
        ArchivosModule,
        MediaModule,
    ],
    controllers: [HermandadesController],
    providers: [HermandadesService],
    exports: [TypeOrmModule],
})
export class HermandadesModule {}
