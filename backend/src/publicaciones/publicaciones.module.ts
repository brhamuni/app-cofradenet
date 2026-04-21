import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publicacion } from './entities/publicacion.entity';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionesController } from './publicaciones.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Publicacion])],
    controllers: [PublicacionesController],
    providers: [PublicacionesService],
    exports: [PublicacionesService],
})
export class PublicacionesModule {}
