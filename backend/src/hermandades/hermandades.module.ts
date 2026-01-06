import { Module } from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { HermandadesController } from './hermandades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hermandad } from './entities/hermandad.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Hermandad])],
    controllers: [HermandadesController],
    providers: [HermandadesService],
})
export class HermandadesModule {}
