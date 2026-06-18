import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaItem } from './entities/media-item.entity';
import { ArchivosModule } from '@backend/archivos/archivos.module';

@Module({
    imports: [TypeOrmModule.forFeature([MediaItem]), ArchivosModule, HttpModule],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule {}
