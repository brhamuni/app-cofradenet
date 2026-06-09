import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UbicacionController } from './ubicacion.controller';
import { UbicacionService } from './ubicacion.service';
import { UbicacionTiempoReal } from './entities/ubicacion-tiempo-real.entity';
import { EstadoPaso } from './entities/estado-paso.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UbicacionTiempoReal, EstadoPaso, Procesion])],
    controllers: [UbicacionController],
    providers: [UbicacionService],
    exports: [UbicacionService],
})
export class UbicacionModule {}
