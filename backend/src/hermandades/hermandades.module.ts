import { Module } from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { HermandadesController } from './hermandades.controller';

@Module({
    controllers: [HermandadesController],
    providers: [HermandadesService],
})
export class HermandadesModule {}
