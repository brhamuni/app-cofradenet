import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario])],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
