import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Publicacion } from '@backend/publicaciones/entities/publicacion.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Usuario,
            Hermandad,
            Banda,
            Ciudad,
            Publicacion,
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
