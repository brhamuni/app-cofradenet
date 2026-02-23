import { Module } from '@nestjs/common';
import { ParticipacionesService } from './participaciones.service';
import { ParticipacionesController } from './participaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participacion } from './entities/participacion.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Participacion, Procesion])],
    controllers: [ParticipacionesController],
    providers: [ParticipacionesService],
})
export class ParticipacionesModule {}
