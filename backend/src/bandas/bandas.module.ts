import { Module } from '@nestjs/common';
import { BandasService } from './bandas.service';
import { BandasController } from './bandas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Banda, Marcha, Participacion, Evento])],
    controllers: [BandasController],
    providers: [BandasService],
    exports: [TypeOrmModule],
})
export class BandasModule {}
