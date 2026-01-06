import { Module } from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { HermandadesController } from './hermandades.controller';
<<<<<<< HEAD
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hermandad } from './entities/hermandad.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Hermandad])],
=======

@Module({
>>>>>>> 43cc433e3cd9796186fa6b717e6bff6c29e816e3
    controllers: [HermandadesController],
    providers: [HermandadesService],
})
export class HermandadesModule {}
