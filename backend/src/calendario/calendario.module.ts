import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarioService } from './calendario.service';
import { CalendarioController } from './calendario.controller';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Seguimiento, Procesion, Evento])],
    controllers: [CalendarioController],
    providers: [CalendarioService],
})
export class CalendarioModule {}
