import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { ArchivosModule } from '@backend/archivos/archivos.module';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario, Banda, Hermandad, Ciudad]), ArchivosModule],
    controllers: [UsuariosController],
    providers: [UsuariosService],
})
export class UsuariosModule {}
