import { Module } from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { HermandadesController } from './hermandades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hermandad } from './entities/hermandad.entity';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
@Module({
    imports: [TypeOrmModule.forFeature([Hermandad, Ciudad])],
    controllers: [HermandadesController],
    providers: [HermandadesService],
    exports: [TypeOrmModule],
})
export class HermandadesModule {}
