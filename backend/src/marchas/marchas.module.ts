import { Module } from '@nestjs/common';
import { MarchasService } from './marchas.service';
import { MarchasController } from './marchas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Marcha } from './entities/marcha.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([Marcha, Usuario])],
    controllers: [MarchasController],
    providers: [MarchasService],
})
export class MarchasModule {}
