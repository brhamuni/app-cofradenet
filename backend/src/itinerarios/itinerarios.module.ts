import { Module } from '@nestjs/common';
import { ItinerariosService } from './itinerarios.service';
import { ItinerariosController } from './itinerarios.controller';

@Module({
  controllers: [ItinerariosController],
  providers: [ItinerariosService],
})
export class ItinerariosModule {}
