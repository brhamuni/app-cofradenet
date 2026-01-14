import { Module } from '@nestjs/common';
import { ProcesionesService } from './procesiones.service';
import { ProcesionesController } from './procesiones.controller';
import { Procesion } from './entities/procesion.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { PuntoItinerario } from './entities/punto-itinerario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Procesion,
            PuntoItinerario,
            Hermandad,
            Participacion,
        ]),
    ],
    controllers: [ProcesionesController],
    providers: [ProcesionesService],
    exports: [ProcesionesService],
})
export class ProcesionesModule {}
