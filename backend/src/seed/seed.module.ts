import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Hermandad } from '../hermandades/entities/hermandad.entity';
import { Procesion } from '../procesiones/entities/procesion.entity';
import { PuntoItinerario } from '../procesiones/entities/punto-itinerario.entity';
import { Paso } from '../procesiones/entities/paso.entity';
import { Banda } from '../bandas/entities/banda.entity';
import { Participacion } from '../participaciones/entities/participacion.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Ciudad,
            Usuario,
            Hermandad,
            Procesion,
            PuntoItinerario,
            Paso,
            Banda,
            Participacion,
        ]),
    ],
    providers: [SeedService],
})
export class SeedModule {}
