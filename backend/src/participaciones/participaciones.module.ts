import { Module } from '@nestjs/common';
import { ParticipacionesService } from './participaciones.service';
import { ParticipacionesController } from './participaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participacion } from './entities/participacion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Participacion])],
    controllers: [ParticipacionesController],
    providers: [ParticipacionesService],
})
export class ParticipacionesModule {}
