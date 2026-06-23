import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seguimiento } from './entities/seguimiento.entity';
import { SeguimientosService } from './seguimientos.service';
import { SeguimientosController } from './seguimientos.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Seguimiento])],
    controllers: [SeguimientosController],
    providers: [SeguimientosService],
    exports: [SeguimientosService],
})
export class SeguimientosModule {}
