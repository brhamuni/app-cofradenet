import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Ciudad } from '../ciudades/entities/ciudad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ciudad, Usuario])],
    providers: [SeedService],
})
export class SeedModule {}
