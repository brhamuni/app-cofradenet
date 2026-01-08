import { Module } from '@nestjs/common';
import { ProcesionesService } from './procesiones.service';
import { ProcesionesController } from './procesiones.controller';

@Module({
    controllers: [ProcesionesController],
    providers: [ProcesionesService],
})
export class ProcesionesModule {}
