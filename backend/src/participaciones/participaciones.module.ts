import { Module } from '@nestjs/common';
import { ParticipacionesService } from './participaciones.service';
import { ParticipacionesController } from './participaciones.controller';

@Module({
    controllers: [ParticipacionesController],
    providers: [ParticipacionesService],
})
export class ParticipacionesModule {}
