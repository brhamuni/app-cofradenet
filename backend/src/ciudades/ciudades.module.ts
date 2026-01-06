import { Module } from '@nestjs/common';
import { CiudadesService } from './ciudades.service';
import { CiudadesController } from './ciudades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ciudad } from './entities/ciudad.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ciudad])],
    controllers: [CiudadesController],
    providers: [CiudadesService],
})
export class CiudadesModule {}
