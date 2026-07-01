import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaItem } from './entities/media-item.entity';
import { ArchivosModule } from '@backend/archivos/archivos.module';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MediaItem, Hermandad, Banda]),
        ArchivosModule,
        HttpModule,
    ],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule {}
