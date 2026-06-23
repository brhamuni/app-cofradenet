import { Module } from '@nestjs/common';
import { ItinerariosService } from './itinerarios.service';
import { ItinerariosController } from './itinerarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Itinerario } from './entities/itinerario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Itinerario])],
    controllers: [ItinerariosController],
    providers: [ItinerariosService],
})
export class ItinerariosModule {}
