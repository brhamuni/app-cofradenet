import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publicacion } from './entities/publicacion.entity';
import { MeGusta } from './entities/me-gusta.entity';
import { Comentario } from './entities/comentario.entity';
import { Seguimiento } from '@backend/seguimientos/entities/seguimiento.entity';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionesController } from './publicaciones.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Publicacion,
            MeGusta,
            Comentario,
            Seguimiento,
        ]),
    ],
    controllers: [PublicacionesController],
    providers: [PublicacionesService],
    exports: [PublicacionesService],
})
export class PublicacionesModule {}
