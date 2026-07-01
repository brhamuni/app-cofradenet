import { Module } from '@nestjs/common';
import { ProcesionesService } from './procesiones.service';
import { ProcesionesController } from './procesiones.controller';
import { Procesion } from './entities/procesion.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { PuntoItinerario } from './entities/punto-itinerario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Itinerario } from '@backend/itinerarios/entities/itinerario.entity';
import { Paso } from './entities/paso.entity';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { UbicacionModule } from '@backend/ubicacion/ubicacion.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Procesion,
            PuntoItinerario,
            Hermandad,
            Participacion,
            Banda,
            Itinerario,
            Paso,
            Seguimiento,
        ]),
        UbicacionModule,
    ],
    controllers: [ProcesionesController],
    providers: [ProcesionesService],
    exports: [ProcesionesService],
})
export class ProcesionesModule {}
