import { Module } from '@nestjs/common';
import { CiudadesService } from './ciudades.service';
import { CiudadesController } from './ciudades.controller';

@Module({
    controllers: [CiudadesController],
    providers: [CiudadesService],
})
export class CiudadesModule {}
