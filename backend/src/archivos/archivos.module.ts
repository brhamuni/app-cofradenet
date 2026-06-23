import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from './entities/archivo.entity';
import { ArchivosService } from './archivos.service';
import { ArchivosController } from './archivos.controller';
import { StorageModule } from '@backend/storage/storage.module';

@Module({
    imports: [TypeOrmModule.forFeature([Archivo]), StorageModule],
    controllers: [ArchivosController],
    providers: [ArchivosService],
    exports: [ArchivosService],
})
export class ArchivosModule {}
